import { z } from 'zod';

export const recyclingProcessSchema = z.object({
  quantityRecycled: z.coerce.number().min(0.01, { message: "Quantity must be greater than 0." }),
  recycledDate: z.date({
    required_error: "A recycled date is required.",
  }),
});
