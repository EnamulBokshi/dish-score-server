import z from "zod";

const createReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
  restaurantId: z.string().min(1, "Restaurant id is required"),
  dishId: z.string().optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
});

const updateReviewSchema = z.object({
  rating: z
    .number()
    .int()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .optional(),
  comment: z.string().optional(),
  tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
});

export { createReviewSchema, updateReviewSchema };
