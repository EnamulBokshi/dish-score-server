import status from "http-status";
import { UserRole } from "../../../generated/prisma/client";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { auth } from "../../lib/auth";
import { tokenUtils } from "../../utils/token";
const createAdmin = async (adminData) => {
    const exAdmin = await prisma.admin.findUnique({
        where: {
            email: adminData.email
        }
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
        }
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
            role: adminData.role
        }
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
        accessToken,
        refreshToken
    };
};
const getAllUsers = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.user, query, {
        filterableFields: ['id', 'name', 'email', 'role', 'status', 'emailVerified', 'isDeleted', 'createdAt', 'updatedAt'],
        searchableFields: ['id', 'name', 'email']
    });
    const result = await queryBuilder
        .search()
        .filter()
        .paginate()
        .include({
        admin: true,
    })
        .sort()
        .execute();
    return result;
};
const getAdminByUserId = async (userId) => {
    return await prisma.admin.findUnique({
        where: {
            userId
        },
        include: {
            user: {
                select: {
                    email: true,
                    role: true,
                    status: true,
                    reviews: true,
                    likes: true,
                }
            }
        }
    });
};
const updateAdmin = async (userId, updateData) => {
    return await prisma.admin.update({
        where: {
            userId
        },
        data: updateData
    });
};
const deleteAdmin = async (userId) => {
    return await prisma.admin.update({
        where: {
            userId
        },
        data: {
            isDeleted: true,
            deletedAt: new Date()
        }
    });
};
export const adminService = {
    createAdmin,
    getAdminByUserId,
    updateAdmin,
    deleteAdmin,
    getAllUsers
};
