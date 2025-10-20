import { z } from 'zod';

export const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email." }),
});

export const settingItemSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  fullAddress: z.string().optional(),
});

// --- NEW SCHEMA FOR PASSWORD ---
export const passwordSchema = z.object({
  currentPassword: z.string().min(1, { message: "Current password is required." }),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords do not match.",
  path: ["confirmPassword"],
});

