/*
enum AdminRole {
    ADMIN
    SUPER_ADMIN
}

model Admin {
    id            String   @id @default(cuid())
    userId        String   @unique
    name          String
    email         String   @unique
    contactNumber String?
    profilePhoto  String?
    role         AdminRole   @default(ADMIN)
    user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
}

*/

import { AdminRole } from "../../../generated/prisma/enums";

export interface ICreateAdmin {
    name: string;
    email: string;
    password: string;
    userId: string;

    contactNumber?: string;
    profilePhoto?: string;
    role: AdminRole;

}

export interface IUpdateAdminPayload{
    name?: string;
    email?: string;
    contactNumber?: string;
    profilePhoto?: string;
    role?: AdminRole;
}
