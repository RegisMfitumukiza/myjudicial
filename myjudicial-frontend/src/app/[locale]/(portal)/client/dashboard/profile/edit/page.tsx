"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiFetch } from "@/lib/api/client";
import { useTranslations } from "next-intl";

type ProfileFormData = {
  firstName: string;
  lastName: string;
  phone?: string;
};
export default function EditProfilePage() {
  const t = useTranslations("clientDashboard.profileEdit");
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile update schema - matching backend UpdateMeDto
  const profileSchema = z.object({
    firstName: z.string().min(2, t("validation.firstNameMin")).max(100, t("validation.firstNameMax")),
    lastName: z.string().min(2, t("validation.lastNameMin")).max(100, t("validation.lastNameMax")),
    phone: z.string().optional().refine(
      (val) => {
        if (!val) return true;
        return val.startsWith("+") && /^\+[1-9]\d{1,14}$/.test(val);
      },
      {
        message: t("validation.phoneFormat"),
      }
    ),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: async () => {
      try {
        // Get current user data from backend /auth/me endpoint
        const response = await apiFetch<{ data: any }>("/auth/me");
        const userData = response.data;
        
        // Extract firstName and lastName from fullName if needed
        let firstName = userData.firstName || "";
        let lastName = userData.lastName || "";
        
        // If we don't have separate first/last names, try to split fullName
        if (!firstName && !lastName && userData.fullName) {
          const [first, ...rest] = userData.fullName.trim().split(" ");
          firstName = first || "";
          lastName = rest.join(" ") || "";
        }
        
        return {
          firstName,
          lastName,
          phone: userData.phone || "",
        };
      } catch (error) {
        console.error("Failed to load profile data:", error);
        toast.error(t("messages.loadFailed"));
        return {
          firstName: "",
          lastName: "",
          phone: "",
        };
      }
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    setIsSubmitting(true);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: data,
      });

      toast.success(t("messages.updateSuccess"));
      router.push("/client/dashboard/profile");
    } catch (error) {
      console.error("Profile update failed:", error);
      toast.error(
        error instanceof Error ? error.message : t("messages.updateFailed")
      );
    } finally {
      setIsSubmitting(false);
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
              {t("back")}
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t("title")}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("subtitle")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Personal Information Section */}
          <section>
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t("personalInfo.title")}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("personalInfo.subtitle")}
              </p>
            </div>

            <Card className="p-6">
              <div className="grid gap-6 sm:grid-cols-2">
                {/* First Name */}
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-sm font-medium">
                    {t("personalInfo.firstNameLabel")}
                  </Label>
                  <Input
                    id="firstName"
                    {...register("firstName")}
                    className={errors.firstName ? "border-red-500" : ""}
                    placeholder={t("personalInfo.firstNamePlaceholder")}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-red-600">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-sm font-medium">
                    {t("personalInfo.lastNameLabel")}
                  </Label>
                  <Input
                    id="lastName"
                    {...register("lastName")}
                    className={errors.lastName ? "border-red-500" : ""}
                    placeholder={t("personalInfo.lastNamePlaceholder")}
                  />
                  {errors.lastName && (
                    <p className="text-sm text-red-600">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t("personalInfo.phoneLabel")}
                  </Label>
                  <Input
                    id="phone"
                    {...register("phone")}
                    className={errors.phone ? "border-red-500" : ""}
                    placeholder={t("personalInfo.phonePlaceholder")}
                    type="tel"
                  />
                  {errors.phone && (
                    <p className="text-sm text-red-600">{errors.phone.message}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    {t("personalInfo.phoneHelperText")}
                  </p>
                </div>
              </div>
            </Card>
          </section>

          {/* Action Buttons */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/client/dashboard/profile")}
            >
              {t("actions.cancel")}
            </Button>

            <Button
              type="submit"
              disabled={!isDirty || isSubmitting}
              className="bg-brand-dark hover:bg-brand-dark/90"
            >
              {isSubmitting ? t("actions.saving") : t("actions.saveChanges")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}