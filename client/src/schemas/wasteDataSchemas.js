import { z } from 'zod';

// This schema is updated to handle IDs from the database instead of plain strings
export const wasteDataSchema = z.object({
  pickupDate: z.coerce.date({ required_error: "A pickup date is required." }),
  wasteCategoryId: z.coerce.string({ required_error: "Please select a category." }),
  wasteTypeId: z.coerce.string({ required_error: "Please select a type." }),

  quantity: z.coerce.number().min(0.01, { message: "Quantity must be > 0." }),
  unit: z.enum(['KG', 'G', 'T', 'LB'], { required_error: "Unit is required." }),

  recycledDate: z.coerce.date({ required_error: "A recycled date is required." }),
  recyclingTechnologyId: z.coerce.string().optional(),

  vehicleType: z.string().optional().or(z.literal("")),
  pickupAddress: z.string().optional().or(z.literal("")),
  facilityAddress: z.string().optional().or(z.literal("")),
  distanceKm: z.coerce.number().optional(),

  wasteImages: z.any().optional(),
  recyclingImages: z.any().optional(),
});

