/*
model Restaurant {
  id          String   @id @default(cuid())
  name        String
  description String?
  address     String
  city        String
  state       String
  road        String
  location   Json

  contact     String?
  images      String[]

  dishes      Dish[]
  reviews     Review[]

  ratingAvg   Float    @default(0)
  totalReviews Int     @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  isDeleted   Boolean  @default(false)
  deletedAt   DateTime?
}
*/
import z from "zod";
const createRestaurantSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string().optional(),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    road: z.string().min(1, "Road is required"),
    location: z.object({
        lat: z.string().min(1, "Latitude is required"),
        lng: z.string().min(1, "Longitude is required"),
    }),
    contact: z.string().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
});
const updateRestaurantSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    description: z.string().optional(),
    address: z.string().min(1, "Address is required").optional(),
    city: z.string().min(1, "City is required").optional(),
    state: z.string().min(1, "State is required").optional(),
    road: z.string().min(1, "Road is required").optional(),
    location: z.object({
        lat: z.string().min(1, "Latitude is required"),
        lng: z.string().min(1, "Longitude is required"),
    }).optional(),
    contact: z.string().optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string().min(1, "Tag cannot be empty")).optional(),
});
export { createRestaurantSchema, updateRestaurantSchema };
