import { z } from 'zod';

// This schema validates the entire multi-step report generation form
export const reportSchemas = z.object({
    reportTitle: z.string().min(5, { message: "Report title must be at least 5 characters." }),
    coverImage: z.any().optional(),
    logo: z.any().optional(),

    clientId: z.string({ required_error: "Please select a client." }),
    dateRange: z.object({
        from: z.date({ required_error: "Please select a start date." }),
        to: z.date({ required_error: "Please select an end date." }),
    }),
    includedWasteTypeIds: z.array(z.string()).min(1, { message: "You must select at least one waste type to include." }),

    //   questions: z.array(z.object({
    //     id: z.string(),
    //     questionText: z.string(),
    //     answerText: z.string().min(10, { message: "Please provide a more detailed answer for each question." }),
    //   })),
    questions: z.array(z.object({
        id: z.string(),
        text: z.string(),
        answerText: z.string().optional(), // Changed from min(10) to optional()
    })),
});

