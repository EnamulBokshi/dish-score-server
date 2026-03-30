import { UserRole } from "../../../generated/prisma/enums";

export interface RegisterUserPayload {
name: string;
email: string;
password: string;
image?: string;
role?: UserRole;
businessName?: string;
contactNumber?: string;
}


export interface IChangePasswordPayload {
    currentPassword: string;
    newPassword: string;
}