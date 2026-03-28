import z from "zod";
const createDishSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    price: z.number().positive("Price must be greater than 0").optional(),
    image: z.string().optional(),
    restaurantId: z.string().min(1, "Restaurant id is required"),
    ingredients: z.array(z.string().min(1, "Ingredient cannot be empty")).min(1, "Ingredients are required"),
});
const updateDishSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    price: z.number().positive("Price must be greater than 0").optional(),
    image: z.string().optional(),
    ingredients: z.array(z.string().min(1, "Ingredient cannot be empty")).optional(),
});
export { createDishSchema, updateDishSchema };
