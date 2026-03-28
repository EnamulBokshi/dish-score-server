import z from "zod";
import { AdminRole, UserRole, UserStatus } from "../../../generated/prisma/enums";
const createAdminSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    contactNumber: z.string().optional(),
    profilePhoto: z.string().optional(),
    role: z.enum(AdminRole, "Role must be either ADMIN or SUPER_ADMIN"),
});
const updateAdminSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.email("Invalid email address").optional(),
    contactNumber: z.string().optional(),
    profilePhoto: z.string().optional(),
    role: z.enum(AdminRole, "Role must be either ADMIN or SUPER_ADMIN").optional(),
});
/*
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean   @default(false)
  image         String?

  likes         Like[]
  reviews     Review[]
  restaurants   Restaurant[]
  admin              Admin?
  ownerProfile       OwnerProfile?
  reviewerProfile    ReviewerProfile?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  role          UserRole  @default(CONSUMER)
  status       UserStatus @default(ACTIVE)
  isDeleted     Boolean   @default(false)
  deletedAt     DateTime?
  sessions      Session[]
  accounts      Account[]

  @@unique([email])
  @@map("user")
  @@index([email])
}
*/
const userUpdateSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    image: z.url("Invalid image URL").optional(),
    status: z.enum(UserStatus, "Status must be either ACTIVE, SUSPENDED, or DELETED").optional(),
    role: z.enum(UserRole, "Role must be either CONSUMER, ADMIN, or SUPER_ADMIN").optional(),
    isDeleted: z.boolean().optional(),
});
export { createAdminSchema, updateAdminSchema, userUpdateSchema };
