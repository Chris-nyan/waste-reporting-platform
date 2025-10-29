import { z } from 'zod';

export const userFormSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  role: z.enum(["ADMIN", "MEMBER"], { required_error: "Please select a role." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }).optional(),
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // If a password is provided, confirmPassword must match
  if (data.password) {
    return data.password === data.confirmPassword;
  }
  return true; // No password provided, so validation passes
}, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const editUserSchema = userFormSchema.safeExtend({
  password: z.string().min(8, { message: "Password must be at least 8 characters." }).optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
});

