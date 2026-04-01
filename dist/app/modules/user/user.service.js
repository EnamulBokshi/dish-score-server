import status from "http-status";
import { UserRole, UserStatus, } from "../../../generated/prisma/client";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { auth } from "../../lib/auth";
import { tokenUtils } from "../../utils/token";
import { deleteFileCloudinary } from "../../../config/cloudinary";
const createAdmin = async (adminData) => {
    const exAdmin = await prisma.admin.findUnique({
        where: {
            email: adminData.email,
        },
    });
    if (exAdmin) {
        throw new AppError(status.BAD_REQUEST, "Admin with this email already exists");
    }
    const userData = await auth.api.signUpEmail({
        body: {
            name: adminData.name,
            email: adminData.email,
            password: adminData.password,
            role: UserRole.ADMIN,
            image: adminData.profilePhoto,
            rememberMe: false,
        },
    });
    if (!userData.user) {
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Failed to create user for admin");
    }
    const result = await prisma.admin.create({
        data: {
            userId: userData.user.id,
            name: adminData.name,
            email: adminData.email,
            contactNumber: adminData.contactNumber,
            profilePhoto: adminData.profilePhoto,
            role: adminData.role,
        },
    });
    const tokenPayload = {
        userId: userData.user.id,
        role: userData.user.role,
        email: userData.user.email,
        name: userData.user.name,
        emailVerified: userData.user.emailVerified,
        isDeleted: userData.user.isDeleted,
        status: userData.user.status,
    };
    const accessToken = tokenUtils.getAccessToken(tokenPayload);
    const refreshToken = tokenUtils.getRefreshToken(tokenPayload);
    return {
        admin: result,
        token: userData.token,
        accessToken,
        refreshToken,
    };
};
const getAllUsers = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.user, query, {
        filterableFields: [
            "id",
            "name",
            "email",
            "role",
            "status",
            "emailVerified",
            "isDeleted",
            "createdAt",
            "updatedAt",
        ],
        searchableFields: ["id", "name", "email"],
    });
    const result = await queryBuilder
        .search()
        .filter()
        .paginate()
        .include({
        admin: true,
    })
        .sort()
        .where({
        isDeleted: false,
    })
        .execute();
    return result;
};
const getAdminByUserId = async (userId) => {
    return await prisma.admin.findUnique({
        where: {
            userId,
        },
        include: {
            user: {
                select: {
                    email: true,
                    role: true,
                    status: true,
                    reviews: true,
                    likes: true,
                },
            },
        },
    });
};
const updateAdmin = async (userId, updateData) => {
    const existingAdmin = await prisma.admin.findUnique({
        where: { userId },
        select: { profilePhoto: true },
    });
    if (!existingAdmin) {
        throw new AppError(status.NOT_FOUND, "Admin not found");
    }
    if (updateData.profilePhoto && existingAdmin.profilePhoto) {
        await deleteFileCloudinary(existingAdmin.profilePhoto).catch((error) => {
            console.error("Error deleting old admin profile photo:", error);
        });
    }
    const updatedAdmin = await prisma.admin.update({
        where: {
            userId,
        },
        data: updateData,
    });
    if (Object.prototype.hasOwnProperty.call(updateData, "profilePhoto")) {
        await prisma.user.update({
            where: { id: userId },
            data: { image: updateData.profilePhoto ?? null },
        });
    }
    return updatedAdmin;
};
const deleteAdmin = async (userId) => {
    const existingAdmin = await prisma.admin.findUnique({
        where: { userId },
        select: { profilePhoto: true },
    });
    if (!existingAdmin) {
        throw new AppError(status.NOT_FOUND, "Admin not found");
    }
    if (existingAdmin.profilePhoto) {
        await deleteFileCloudinary(existingAdmin.profilePhoto).catch((error) => {
            console.error("Error deleting admin profile photo:", error);
        });
    }
    const deletedAdmin = await prisma.admin.update({
        where: {
            userId,
        },
        data: {
            isDeleted: true,
            deletedAt: new Date(),
            profilePhoto: null,
        },
    });
    await prisma.user.update({
        where: { id: userId },
        data: { image: null, isDeleted: true, status: UserStatus.INACTIVE },
    });
    return deletedAdmin;
};
const getUserById = async (userId) => {
    return await prisma.user.findUnique({
        where: {
            id: userId,
        },
        include: {
            admin: true,
            reviews: true,
            likes: true,
            restaurants: true,
            reviewerProfile: true,
            ownerProfile: true,
        },
    });
};
const updateUser = async (userId, updateData) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true },
    });
    if (!existingUser) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    if (updateData.image && existingUser.image) {
        await deleteFileCloudinary(existingUser.image).catch((error) => {
            console.error("Error deleting old user profile photo:", error);
        });
    }
    const updatedUser = await prisma.user.update({
        where: {
            id: userId,
        },
        data: updateData,
    });
    return updatedUser;
};
const deleteUser = async (userId) => {
    const existingUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { image: true, role: true, id: true, email: true },
    });
    if (!existingUser) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    if (existingUser.image) {
        await deleteFileCloudinary(existingUser.image).catch((error) => {
            console.error("Error deleting user profile photo:", error);
        });
    }
    try {
        // const result = await auth.api.deleteUser();
        const result = await prisma.$transaction(async (tx) => {
            const role = existingUser.role;
            if (role === UserRole.ADMIN) {
                await tx.admin.update({
                    where: { userId },
                    data: { isDeleted: true, deletedAt: new Date(), profilePhoto: null },
                });
            }
            else if (role === UserRole.OWNER) {
                await tx.ownerProfile.update({
                    where: { userId },
                    data: { isDeleted: true, deletedAt: new Date() },
                });
            }
            else if (role === UserRole.CONSUMER) {
                await tx.reviewerProfile.update({
                    where: { userId },
                    data: { isDeleted: true, deletedAt: new Date() },
                });
            }
            const deletedUser = await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    isDeleted: true,
                    deletedAt: new Date(),
                    status: UserStatus.INACTIVE,
                    image: null,
                }
            });
            return deletedUser;
        });
        return result;
    }
    catch (error) {
        console.error("Error during user deletion process:", error);
        throw new AppError(status.INTERNAL_SERVER_ERROR, "An error occurred while deleting the user");
    }
};
export const UserServices = {
    createAdmin,
    getAdminByUserId,
    updateAdmin,
    deleteAdmin,
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
};
