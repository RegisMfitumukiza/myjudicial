import { getErrorMessage } from "../../../shared/utils/i18n-messages.js";
import { prisma } from "../../../infrastructure/database/prisma.js";
import { NotFoundError, ValidationError } from "../../../shared/errors/index.js";
import { writeAuditLog } from "../../../shared/utils/audit.js";
import type { CompleteStepDto, SkipStepDto, UpdateProgressDto } from "./onboarding.schemas.js";


interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  estimatedMinutes: number;
  dependencies?: string[];
}

interface PhotoStatus {
  hasPhoto: boolean;
  needsPhoto: boolean;
  urgency: 'low' | 'medium' | 'high';
  message: string;
}

interface OnboardingProgress {
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  totalSteps: number;
  completionPercentage: number;
  canProceedToNext: boolean;
  isComplete: boolean;
  steps: OnboardingStep[];
  nextRecommendedStep?: string;
  estimatedTimeRemaining: number;
  photoStatus: PhotoStatus;
}

export const OnboardingService = {
  async getProgress(userId: string): Promise<OnboardingProgress> {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      include: {
        user: { 
          select: { 
            phone: true, 
            firstName: true, 
            lastName: true,
            email: true 
          } 
        },
        services: { where: { isActive: true } },
        education: true,
        certifications: true,
        verifications: { 
          orderBy: { createdAt: 'desc' }, 
          take: 1 
        }
      },
    });

    // If no profile exists, return initial state
    if (!profile) {
      return {
        currentStep: "profile",
        completedSteps: [],
        skippedSteps: [],
        totalSteps: 5,
        completionPercentage: 0,
        canProceedToNext: false,
        isComplete: false,
        nextRecommendedStep: "profile",
        estimatedTimeRemaining: 25,
        steps: await this.getStepsDefinition(null),
        photoStatus: {
          hasPhoto: false,
          needsPhoto: false,
          urgency: 'low' as const,
          message: this.getPhotoReminderMessage('low', false),
        },
      };
    }

    const [availabilityCount, onboardingRecord] = await Promise.all([
      prisma.expertAvailability.count({ where: { expertId: profile.id } }),
      this.getOrCreateOnboardingRecord(userId)
    ]);

    // Evaluate step completion
    const stepCompletions = {
      profile: this.isProfileStepComplete(profile),
      services: profile.services.length > 0,
      availability: availabilityCount > 0,
      verification: profile.verifications.length > 0,
      compliance: profile.status === "VERIFIED"
    };

    const profileCompletionStatus = this.getProfileCompletionStatus(profile);
    const photoStatus: PhotoStatus = {
      hasPhoto: profileCompletionStatus.hasPhoto,
      needsPhoto: profileCompletionStatus.needsPhoto,
      urgency: profileCompletionStatus.photoUrgency,
      message: this.getPhotoReminderMessage(profileCompletionStatus.photoUrgency, profileCompletionStatus.hasPhoto),
    };

    const completedSteps = Object.entries(stepCompletions)
      .filter(([_, completed]) => completed)
      .map(([step]) => step);

    const totalSteps = 5;
    const completionPercentage = Math.round((completedSteps.length / totalSteps) * 100);
    const isComplete = completedSteps.length === totalSteps;

    // Determine current/next step
    const stepOrder = ["profile", "services", "availability", "verification", "compliance"];
    const currentStep = isComplete 
      ? "complete" 
      : stepOrder.find(step => !completedSteps.includes(step)) || "complete";

    const nextRecommendedStep = this.getNextRecommendedStep(stepCompletions);
    const estimatedTimeRemaining = this.calculateEstimatedTime(stepCompletions);

    return {
      currentStep,
      completedSteps,
      skippedSteps: onboardingRecord.skippedSteps || [],
      totalSteps,
      completionPercentage,
      canProceedToNext: this.canProceedToNextStep(currentStep, stepCompletions),
      isComplete,
      nextRecommendedStep,
      estimatedTimeRemaining,
      steps: await this.getStepsDefinition(stepCompletions),
      photoStatus,
    };
  },

  /**
   * Get contextual reminder message for photo upload
   */
  getPhotoReminderMessage(urgency: 'low' | 'medium' | 'high', hasPhoto: boolean): string {
    if (hasPhoto) return "Profile photo uploaded ✓";
    
    switch (urgency) {
      case 'high':
        return "⚠️ Add your profile photo to build trust with clients. Profiles with photos get 3x more bookings.";
      case 'medium':
        return "📸 Upload your professional headshot to complete your profile and attract more clients.";
      case 'low':
      default:
        return "💡 Consider adding a professional photo to make your profile more trustworthy.";
    }
  },

  async completeStep(userId: string, dto: CompleteStepDto) {
    const onboardingRecord = await this.getOrCreateOnboardingRecord(userId);
    const progress = await this.getProgress(userId);

    // Validate step can be completed
    if (progress.completedSteps.includes(dto.step)) {
      throw new ValidationError("Step is already completed");
    }

    // Note: Profile completion does NOT change verification status
    // Verification status should ONLY change when documents are submitted via verification endpoint
    // This prevents the bug where experts show "PENDING_VERIFICATION" without actually submitting documents

    // Log completion
    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "EXPERT",
      resourceId: userId,
      description: `Completed onboarding step: ${dto.step}`,
      metadata: { step: dto.step, data: dto.data }
    });

    return this.getProgress(userId);
  },

  async skipStep(userId: string, dto: SkipStepDto) {
    const onboardingRecord = await this.getOrCreateOnboardingRecord(userId);
    
    // Update skipped steps
    const skippedSteps: string[] = onboardingRecord.skippedSteps || [];
    if (!skippedSteps.includes(dto.step)) {
      skippedSteps.push(dto.step);
      
      // Store in user metadata or create onboarding tracking table
      // For now, we'll use audit logs to track this
      await writeAuditLog({
        actorId: userId,
        action: "UPDATE", 
        resource: "EXPERT",
        resourceId: userId,
        description: `Skipped onboarding step: ${dto.step}`,
        metadata: { step: dto.step, reason: dto.reason }
      });
    }

    return this.getProgress(userId);
  },

  async updateProgress(userId: string, dto: UpdateProgressDto) {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      throw new NotFoundError(getErrorMessage('EXPERT_NOT_FOUND'));
    }

    // Update onboarding completion status
    await writeAuditLog({
      actorId: userId,
      action: "UPDATE",
      resource: "EXPERT", 
      resourceId: userId,
      description: `Updated onboarding progress`,
      metadata: dto
    });

    return this.getProgress(userId);
  },

  isProfileStepComplete(profile: any): boolean {
    const hasBasicInfo = !!(
      profile.displayName &&
      profile.bio &&
      profile.primarySpecialty &&
      profile.user?.phone &&
      profile.user?.firstName &&
      profile.user?.lastName
    );
    
    // Profile is considered complete even without photo, but we track it separately
    return hasBasicInfo;
  },

  /**
   * Check if expert has uploaded a profile photo
   */
  hasProfilePhoto(profile: any): boolean {
    return !!(profile.profileImageObjectKey);
  },

  /**
   * Get profile completion with photo status
   */
  getProfileCompletionStatus(profile: any) {
    const hasBasicInfo = this.isProfileStepComplete(profile);
    const hasPhoto = this.hasProfilePhoto(profile);
    
    return {
      isComplete: hasBasicInfo,
      hasPhoto: hasPhoto,
      needsPhoto: hasBasicInfo && !hasPhoto, // Profile complete but missing photo
      photoUrgency: this.getPhotoUploadUrgency(profile)
    };
  },

  /**
   * Determine urgency level for photo upload reminder
   */
  getPhotoUploadUrgency(profile: any): 'low' | 'medium' | 'high' {
    if (this.hasProfilePhoto(profile)) return 'low';
    
    const daysSinceCreated = profile.createdAt 
      ? Math.floor((Date.now() - new Date(profile.createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
      
    if (daysSinceCreated > 7) return 'high';      // 1+ weeks without photo
    if (daysSinceCreated > 3) return 'medium';    // 3+ days without photo  
    return 'low';                                 // Recent registration
  },

  getNextRecommendedStep(completions: Record<string, boolean>): string | undefined {
    const stepOrder = ["profile", "services", "availability", "verification", "compliance"];
    return stepOrder.find(step => !completions[step]);
  },

  calculateEstimatedTime(completions: Record<string, boolean>): number {
    const stepTimes = {
      profile: 8,
      services: 5, 
      availability: 3,
      verification: 7,
      compliance: 2
    };

    return Object.entries(completions)
      .filter(([_, completed]) => !completed)
      .reduce((total, [step]) => total + (stepTimes[step as keyof typeof stepTimes] || 0), 0);
  },

  canProceedToNextStep(currentStep: string, completions: Record<string, boolean>): boolean {
    const dependencies = {
      services: ["profile"],
      availability: ["profile"],
      verification: ["profile", "services"],
      compliance: ["profile", "services", "availability", "verification"]
    };

    const deps = dependencies[currentStep as keyof typeof dependencies] || [];
    return deps.every(dep => completions[dep]);
  },

  async getStepsDefinition(completions: Record<string, boolean> | null): Promise<OnboardingStep[]> {
    const completed = completions || {};
    
    return [
      {
        id: "profile",
        title: "Complete Your Profile",
        description: "Add your professional details, bio, and contact information",
        completed: completed.profile || false,
        required: true,
        estimatedMinutes: 8,
      },
      {
        id: "services", 
        title: "Add Legal Services",
        description: "Define your service offerings and pricing",
        completed: completed.services || false,
        required: true,
        estimatedMinutes: 5,
        dependencies: ["profile"]
      },
      {
        id: "availability",
        title: "Set Your Availability", 
        description: "Configure your working hours and schedule",
        completed: completed.availability || false,
        required: true,
        estimatedMinutes: 3,
        dependencies: ["profile"]
      },
      {
        id: "verification",
        title: "Submit Verification Documents",
        description: "Upload your bar certificate and identification",
        completed: completed.verification || false,
        required: true,
        estimatedMinutes: 7,
        dependencies: ["profile", "services"]
      },
      {
        id: "compliance",
        title: "Complete Verification Process",
        description: "Wait for admin approval of your documents",
        completed: completed.compliance || false,
        required: true,
        estimatedMinutes: 2,
        dependencies: ["verification"]
      }
    ];
  },

  async getOrCreateOnboardingRecord(userId: string) {
    // For now, return empty record since we're using audit logs
    // In production, you might want a dedicated onboarding_progress table
    return {
      userId,
      skippedSteps: [],
      currentStep: "profile",
      completedAt: null
    };
  }
};
