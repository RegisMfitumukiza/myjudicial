"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/routing";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfilePhotoUpload } from "@/features/experts/components/ProfilePhotoUpload";
import { FreeLocationInput } from "@/shared/components/location/FreeLocationInput";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  useExpertPhotoUrl,
  useInvalidateProfilePhoto,
  useExpertProfile,
  EXPERT_PROFILE_QUERY_KEY,
} from "@/features/experts/hooks/useExpertProfile";

interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  method?: string;
  placeId?: string;
  accuracy?: number;
}

export default function EditProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Fetch current profile to pre-populate office address and coordinates
  const { data: profile } = useExpertProfile();

  useEffect(() => {
    if (profile && !location) {
      if (profile.latitude != null && profile.longitude != null) {
        setLocation({
          latitude: profile.latitude,
          longitude: profile.longitude,
          address: profile.officeAddress || `${profile.city || "Kigali"}, Rwanda`,
        });
      }
    }
  }, [profile, location]);

  // Fetch the signed photo URL from the backend (not from stale session)
  const { data: currentPhotoUrl } = useExpertPhotoUrl();
  const invalidateProfilePhoto = useInvalidateProfilePhoto();

  const handlePhotoUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", file);

      await apiFetch("/experts/photo/profile", {
        method: "POST",
        body: formData,
      });

      await invalidateProfilePhoto();
      toast.success("Profile photo uploaded successfully!");
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload photo. Please try again."
      );
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoRemove = async () => {
    try {
      await apiFetch("/experts/photo/profile", { method: "DELETE" });
      await invalidateProfilePhoto();
      toast.success("Profile photo removed successfully");
    } catch (error) {
      console.error("Failed to remove photo:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to remove photo. Please try again."
      );
      throw error;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: Record<string, unknown> = {};

      if (location) {
        body.officeAddress = location.address;
        body.latitude = location.latitude;
        body.longitude = location.longitude;
      }

      await apiFetch("/experts/profile/me", {
        method: "PATCH",
        body,
      });

      await queryClient.invalidateQueries({ queryKey: EXPERT_PROFILE_QUERY_KEY });
      toast.success("Profile updated successfully!");
      router.push("/expert/dashboard");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save profile changes. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto max-w-4xl px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Profile
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Update your professional profile and settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="space-y-8">

          {/* Profile Photo Section */}
          <section id="photo">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Profile Photo
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Add or update your professional headshot
              </p>
            </div>

            <ProfilePhotoUpload
              currentPhotoUrl={currentPhotoUrl}
              onPhotoUpload={handlePhotoUpload}
              onPhotoRemove={handlePhotoRemove}
              isUploading={isUploading}
            />
          </section>

          {/* Location Section */}
          <section id="location">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Office Location
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Help clients find you by providing your verified office location
              </p>
            </div>

            <Card className="p-6">
              <FreeLocationInput value={location} onChange={setLocation} />

              {location && (
                <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/20">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Location Set
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300 mt-1">
                    📍 {location.address}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-300">
                    Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                  </p>
                </div>
              )}
            </Card>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
            <Button variant="outline" onClick={() => router.push("/expert/dashboard")} disabled={isSaving}>
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}
