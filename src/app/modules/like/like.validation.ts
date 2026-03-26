import z from "zod";

const createLikeSchema = z.object({
  reviewId: z.string().min(1, "Review id is required"),
});

export { createLikeSchema };
