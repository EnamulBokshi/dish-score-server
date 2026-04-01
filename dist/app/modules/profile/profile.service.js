import status from "http-status";
import prisma from "../../lib/prisma";
import AppError from "../../helpers/errorHelpers/AppError";
const getMyProfile = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            status: true,
            emailVerified: true,
            ownerProfile: true,
            reviewerProfile: true,
            admin: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    if (!user) {
        throw new AppError(status.NOT_FOUND, "User not found");
    }
    return user;
};
const updateOwnerProfile = async (userId, payload) => {
    return await prisma.ownerProfile.upsert({
        where: { userId },
        update: payload,
        create: {
            userId,
            ...payload,
        },
    });
};
const updateReviewerProfile = async (userId, payload) => {
    return await prisma.reviewerProfile.upsert({
        where: { userId },
        update: payload,
        create: {
            userId,
            ...payload,
        },
    });
};
export const ProfileService = {
    getMyProfile,
    updateOwnerProfile,
    updateReviewerProfile,
};
