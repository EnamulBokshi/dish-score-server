import z from "zod";

const createDishSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0").optional(),
  image: z.string().optional(),
  restaurantId: z.string().min(1, "Restaurant id is required"),
});

const updateDishSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  price: z.number().positive("Price must be greater than 0").optional(),
  image: z.string().optional(),
});

export { createDishSchema, updateDishSchema };
