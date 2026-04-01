import z from "zod";
import { ContactMessageStatus } from "../../../generated/prisma/enums";
const createContactSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Invalid email address"),
    phone: z.string().optional(),
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
});
const updateContactStatusSchema = z.object({
    status: z.enum(ContactMessageStatus, "Status must be PENDING, IN_PROGRESS, or RESOLVED"),
});
const replyContactSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    message: z.string().min(1, "Message is required"),
});
export { createContactSchema, updateContactStatusSchema, replyContactSchema };
