import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

/** Shared reusable field definitions */
const email = z
  .email("Invalid email address")
  .min(1, "Email is required")
  .toLowerCase()
  .trim();

const fullName = z
  .string()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name must be under 100 characters")
  .trim();

const phone = z
  .string()
  .refine(
    (val) => {
      if (!val) return true;
      return val.startsWith("+") && isValidPhoneNumber(val);
    },
    {
      message: "Phone number must be a valid international format starting with '+' (e.g. +250788000000)",
    }
  )
  .optional();

/** Required variant — Mobile Money payments (booking) need a phone on file. */
const requiredPhone = z
  .string()
  .min(1, "Phone number is required.")
  .refine((val) => val.startsWith("+") && isValidPhoneNumber(val), {
    message: "Phone number must be a valid international format starting with '+' (e.g. +250788000000)",
  });

/** Normalizes frontend-facing role names to the DB role enum. */
const registerRole = z
  .enum(["CLIENT", "CITIZEN", "EXPERT"])
  .transform((val) => (val === "CLIENT" ? "CITIZEN" : val));

/** POST /auth/register */
export const registerSchema = z.object({
  email,
  fullName,
  phone: requiredPhone,
  role: registerRole.optional(),
  preferredLanguage: z.enum(["en", "fr", "rw"]).default("en"),
});

/** POST /auth/login — admin email + password login */
export const loginSchema = z.object({
  email,
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/** POST /auth/otp/send */
export const sendOtpSchema = z.object({ email });

/** POST /auth/otp/verify */
export const verifyOtpSchema = z.object({
  email,
  token: z
    .string()
    .min(1, "OTP token is required")
    .length(6, "OTP must be exactly 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

/** POST /auth/magic-link */
export const magicLinkSchema = z.object({ email });

/** POST /auth/refresh */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
});

/** POST /auth/logout */
export const logoutSchema = z.object({
  refreshToken: z.string().optional(),
});

/** PATCH /auth/me */
export const updateMeSchema = z.object({
  firstName: fullName.optional().describe("Updated first name"),
  lastName: fullName.optional().describe("Updated last name"),
  phone: phone.describe("Updated phone number in international format"),
  preferredLanguage: z.enum(["en", "fr", "rw"]).optional().describe("Preferred interface language"),
});

/** PUT /auth/me/notification-preferences */
export const notificationPreferencesSchema = z.object({
  email: z.boolean().default(true),
  whatsapp: z.boolean().default(true),
  push: z.boolean().default(true),
  inApp: z.boolean().default(true),
});

/** POST /auth/admin/change-password */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

/** POST /auth/forgot-password */
export const forgotPasswordSchema = z.object({ email });

/** POST /auth/reset-password */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(12, "Password must be at least 12 characters"),
});

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type SendOtpDto = z.infer<typeof sendOtpSchema>;
export type VerifyOtpDto = z.infer<typeof verifyOtpSchema>;
export type MagicLinkDto = z.infer<typeof magicLinkSchema>;
export type RefreshDto = z.infer<typeof refreshSchema>;
export type UpdateMeDto = z.infer<typeof updateMeSchema>;
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;
export type NotificationPreferencesDto = z.infer<typeof notificationPreferencesSchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;