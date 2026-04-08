import z from "zod";

const createTestimonialSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  feedback: z.string().min(1, "Feedback is required"),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional(),
});

const updateTestimonialSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  feedback: z.string().min(1, "Feedback cannot be empty").optional(),
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional(),
});

export { createTestimonialSchema, updateTestimonialSchema };
