

import z from "zod";
import { AdminRole } from "../../../generated/prisma/enums";

const createAdminSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
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


export { createAdminSchema, updateAdminSchema };