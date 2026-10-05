import { apiFetch } from "./client";

export interface UploadImageResult {
  url: string;
  objectKey: string;
  fileName: string;
  size: number;
  mimetype?: string;
}

/**
 * Upload an image asset to OCI or local storage for CMS pages or Platform Settings.
 * Supports jpeg, png, webp, gif, svg up to 10MB.
 */
export async function uploadContentImage(file: File): Promise<UploadImageResult> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed.");
  }
  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Image must be smaller than 10 MB.");
  }

  const formData = new FormData();
  formData.append("image", file);

  const res = await apiFetch<{ success: boolean; data: UploadImageResult }>("/admin/content/upload-image", {
    method: "POST",
    body: formData,
  });

  if (!res?.data?.url) {
    throw new Error("Upload did not return a valid image URL.");
  }

  return res.data;
}
