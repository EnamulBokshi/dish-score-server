import z from "zod";
const updateOwnerProfileSchema = z.object({
    businessName: z.string().min(1, "Business name is required").optional(),
    contactNumber: z.string().min(1, "Contact number is required").optional(),
});
const updateReviewerProfileSchema = z.object({
    bio: z.string().max(500, "Bio must be at most 500 characters").optional(),
});
export { updateOwnerProfileSchema, updateReviewerProfileSchema };
