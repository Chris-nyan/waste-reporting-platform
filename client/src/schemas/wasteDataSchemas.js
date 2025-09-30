import { z } from 'zod';

// This schema is updated to include all optional logistics fields
export const wasteDataSchema = z.object({
  pickupDate: z.coerce.date({
    required_error: "A pickup date is required.",
    invalid_type_error: "That's not a valid date!",
  }),
  wasteCategory: z.string({ required_error: "Please select a category."}),
  wasteType: z.string().min(2, { message: "Waste type is required." }),
  quantity: z.coerce.number().min(0.01, { message: "Quantity must be > 0." }),
  unit: z.enum(['KG', 'G', 'T', 'LB'], { required_error: "Unit is required." }),
  
  recycledDate: z.coerce.date({
    required_error: "A recycled date is required.",
    invalid_type_error: "That's not a valid date!",
  }),
  recyclingTechnology: z.string().optional(),
  vehicleType: z.string().optional(),

  pickupAddress: z.string().optional(),
  facilityAddress: z.string().optional(),
  distanceKm: z.coerce.number().optional(),

  wasteImages: z.any().optional(),
  recyclingImages: z.any().optional(),
});

