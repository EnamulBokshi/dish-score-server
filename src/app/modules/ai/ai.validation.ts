import z from "zod";

const chatRequestSchema = z.object({
  query: z.string().min(2, "Query is required").max(300, "Query is too long"),
  maxPrice: z.number().positive("maxPrice must be positive").optional(),
  top: z.number().int().min(1).max(5).optional(),
});

const reviewDescriptionRequestSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(120).optional(),
  rating: z.number().min(1).max(5),
  tags: z.array(z.string().min(1)).max(15).optional(),
  dishName: z.string().min(1, "Dish name is required").max(120),
  restaurantName: z.string().min(1, "Restaurant name is required").max(120),
  restaurantRatingAvg: z.number().min(0).max(5),
  dishRating: z.number().min(0).max(5),
});

const searchSuggestionsRequestSchema = z.object({
  query: z.string().min(1, "Query is required").max(60),
  limit: z.number().int().min(1).max(10).optional(),
});

export {
  chatRequestSchema,
  reviewDescriptionRequestSchema,
  searchSuggestionsRequestSchema,
};
