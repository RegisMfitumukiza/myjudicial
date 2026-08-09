import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { 
  uploadObject, 
  deleteObject, 
  getSignedDownloadUrl,
  headObject,
  scanForMalware
} from "../../../infrastructure/storage/oci-object-storage.service.js";
import { NotFoundError, ValidationError, FileUploadError } from "../../../shared/errors/index.js";
import { logger } from "../../../shared/utils/logger.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import sharp from "sharp";


interface PhotoUploadResult {
  photoUrl: string;
  objectKey: string;
  uploadedAt: string;
}

interface PhotoUrlResult {
  photoUrl: string;
  expiresAt: string;
}

export const PhotoService = {
  /**
   * Upload and process expert profile photo
   */
  async uploadProfilePhoto(userId: string, file: Express.Multer.File): Promise<PhotoUploadResult> {
    // Find expert profile
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      include: { user: true }
    });

    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // Validate file
    await this.validatePhotoFile(file);

    // Process and optimize image
    const processedBuffer = await this.processImage(file.buffer);

    // Generate object key
    const timestamp = Date.now();
    const fileExtension = this.getFileExtension(file.originalname);
    const objectKey = `experts/${profile.id}/profile/photo_${timestamp}.${fileExtension}`;

    try {
      // Upload to OCI
      const uploadedKey = await uploadObject({
        key: objectKey,
        body: processedBuffer,
        contentType: file.mimetype,
        metadata: {
          userId: userId,
          expertId: profile.id,
          originalName: file.originalname,
          uploadedAt: new Date().toISOString(),
          processedWith: "sharp"
        }
      });

      // Scan for malware (if configured)
      await scanForMalware(uploadedKey);

      // Delete old photo if exists
      if (profile.profileImageObjectKey) {
        try {
          await deleteObject(profile.profileImageObjectKey);
        } catch (error) {
          logger.warn("Failed to delete old profile photo", { 
            oldKey: profile.profileImageObjectKey, 
            error 
          });
        }
      }

      // Update both expert profile photo AND user avatar atomically
      // This keeps the sidebar avatar, public listing, and setup checklist all in sync
      const [updatedProfile] = await prisma.$transaction([
        prisma.expertProfile.update({
          where: { id: profile.id },
          data: {
            profileImageObjectKey: uploadedKey,
            profileImageUpdatedAt: new Date()
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: { avatarObjectKey: uploadedKey }
        })
      ]);

      // Write audit log
      await writeAuditLog({
        actorId: userId,
        action: "UPDATE",
        resource: "EXPERT",
        resourceId: profile.id,
        description: "Profile photo uploaded",
        metadata: {
          objectKey: uploadedKey,
          fileSize: processedBuffer.length,
          originalName: file.originalname
        }
      });

      // Generate signed URL for immediate access
      const { url: photoUrl } = await getSignedDownloadUrl(uploadedKey);

      logger.info("Profile photo uploaded successfully", {
        userId,
        expertId: profile.id,
        objectKey: uploadedKey,
        fileSize: processedBuffer.length
      });

      return {
        photoUrl,
        objectKey: uploadedKey,
        uploadedAt: updatedProfile.profileImageUpdatedAt!.toISOString()
      };

    } catch (error) {
      logger.error("Profile photo upload failed", { userId, error });
      throw new FileUploadError("Failed to upload profile photo");
    }
  },

  /**
   * Remove expert profile photo
   */
  async removeProfilePhoto(userId: string): Promise<void> {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    if (!profile.profileImageObjectKey) {
      throw new ValidationError("No profile photo to remove");
    }

    try {
      // Delete from OCI
      await deleteObject(profile.profileImageObjectKey);

      // Update database
      await prisma.expertProfile.update({
        where: { id: profile.id },
        data: {
          profileImageObjectKey: null,
          profileImageUpdatedAt: new Date()
        }
      });

      // Write audit log
      await writeAuditLog({
        actorId: userId,
        action: "DELETE",
        resource: "EXPERT",
        resourceId: profile.id,
        description: "Profile photo removed",
        metadata: {
          deletedKey: profile.profileImageObjectKey
        }
      });

      logger.info("Profile photo removed successfully", {
        userId,
        expertId: profile.id,
        deletedKey: profile.profileImageObjectKey
      });

    } catch (error) {
      logger.error("Profile photo removal failed", { userId, error });
      throw new FileUploadError("Failed to remove profile photo");
    }
  },

  /**
   * Get signed URL for profile photo download
   */
  async getProfilePhotoUrl(userId: string): Promise<PhotoUrlResult> {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    if (!profile.profileImageObjectKey) {
      throw new NotFoundError("No profile photo found");
    }

    // Check if object still exists in storage
    const objectInfo = await headObject(profile.profileImageObjectKey);
    if (!objectInfo) {
      // Object doesn't exist, clean up database
      await prisma.expertProfile.update({
        where: { id: profile.id },
        data: {
          profileImageObjectKey: null,
          profileImageUpdatedAt: new Date()
        }
      });
      throw new NotFoundError("Profile photo not found in storage");
    }

    // Generate signed URL
    const { url, expiresAt } = await getSignedDownloadUrl(profile.profileImageObjectKey);

    return {
      photoUrl: url,
      expiresAt: expiresAt.toISOString()
    };
  },

  /**
   * Validate uploaded photo file
   */
  async validatePhotoFile(file: Express.Multer.File): Promise<void> {
    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new ValidationError("File size must be less than 5MB");
    }

    // Check MIME type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new ValidationError("Only JPEG, PNG, and WebP images are allowed");
    }

    // Validate actual image content using sharp
    try {
      const metadata = await sharp(file.buffer).metadata();
      
      // Check dimensions
      if (!metadata.width || !metadata.height) {
        throw new ValidationError("Invalid image file");
      }

      // Check minimum dimensions
      if (metadata.width < 100 || metadata.height < 100) {
        throw new ValidationError("Image must be at least 100x100 pixels");
      }

      // Check maximum dimensions
      if (metadata.width > 4000 || metadata.height > 4000) {
        throw new ValidationError("Image must not exceed 4000x4000 pixels");
      }

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError("Invalid image file format");
    }
  },

  /**
   * Process and optimize image
   */
  async processImage(buffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(800, 800, { 
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ 
          quality: 85,
          progressive: true
        })
        .toBuffer();
    } catch (error) {
      logger.error("Image processing failed", { error });
      throw new ValidationError("Failed to process image");
    }
  },

  /**
   * Get file extension from filename
   */
  getFileExtension(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension || 'jpg';
  }
};