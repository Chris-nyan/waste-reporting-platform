import { z } from 'zod';

// Schema for the Sign In form (remains unchanged)
export const signinSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

// Base schema for common registration fields
const baseSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long." }),
  confirmPassword: z.string(),
  role: z.enum(['USER', 'VENDOR']),
});

// Extended schema for vendors, now including the full structured address
const vendorSchema = baseSchema.extend({
    role: z.literal('VENDOR'),
    businessName: z.string().min(2, { message: "Business name is required." }),
    phone: z.string().min(10, { message: "A valid phone number is required." }),
    street: z.string().min(5, { message: "Street address is required." }),
    district: z.string().min(2, { message: "District is required." }), // New district field
    city: z.string().min(2, { message: "City/Province is required." }),
    zipCode: z.string().min(4, { message: "Zip code is required." }),
    country: z.string().min(2, { message: "Country is required." }),
    operatingHours: z.string().min(5, { message: "Operating hours are required (e.g., Mon-Fri 9am-5pm)." }),
});

// Schema for regular users
const userSchema = baseSchema.extend({
    role: z.literal('USER'),
});

// The final schema combines the user and vendor schemas and adds password confirmation logic
export const signupSchema = z.discriminatedUnion("role", [
    userSchema,
    vendorSchema
]).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

