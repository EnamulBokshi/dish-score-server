import status from "http-status";
import { IUpdateOwnerProfilePayload, IUpdateReviewerProfilePayload } from "./profile.interface";
import prisma from "../../lib/prisma";
import AppError from "../../helpers/errorHelpers/AppError";

const getMyProfile = async (userId: string) => {
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

const updateOwnerProfile = async (userId: string, payload: IUpdateOwnerProfilePayload) => {
  return await prisma.ownerProfile.upsert({
    where: { userId },
    update: payload,
    create: {
      userId,
      ...payload,
    },
  });
};

const updateReviewerProfile = async (userId: string, payload: IUpdateReviewerProfilePayload) => {
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
