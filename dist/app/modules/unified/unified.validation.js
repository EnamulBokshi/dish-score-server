import z from "zod";
const createUnifiedSchema = z.object({
    restaurant: z.object({
        data: z.object({
            name: z.string().min(1, "Restaurant name is required"),
            description: z.string().optional(),
            address: z.string().min(1, "Address is required"),
            city: z.string().min(1, "City is required"),
            state: z.string().min(1, "State is required"),
            road: z.string().min(1, "Road is required"),
            location: z.object({
                lat: z.union([z.string(), z.number()]),
                lng: z.union([z.string(), z.number()]),
            }),
            contact: z.string().optional(),
            tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
        }),
        images: z.array(z.string()).optional(),
    }),
    dish: z.object({
        data: z.object({
            name: z.string().min(1, "Dish name is required"),
            description: z.string().optional(),
            price: z.number().positive("Price must be greater than 0").optional(),
            ingredients: z
                .array(z.string().min(1, "Ingredient cannot be empty"))
                .min(1, "Ingredients are required"),
            tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
            image: z.string().optional(),
        }),
        images: z.array(z.string()).optional(),
    }),
    review: z.object({
        data: z.object({
            rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
            comment: z.string().optional(),
            tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
        }),
        images: z.array(z.string()).optional(),
        image: z.union([z.string(), z.array(z.string())]).optional(),
    }),
});
export { createUnifiedSchema };
