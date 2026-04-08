import status from "http-status";
import { Prisma, Testimonial, UserRole } from "../../../generated/prisma/client";
import { IQueryParams } from "../../../interfaces/query.interfaces";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { ICreateTestimonialPayload, IUpdateTestimonialPayload } from "./testimonial.interface";

interface ITestimonialRequester {
	userId: string;
	role: UserRole;
}

const isAdminRole = (role: UserRole) => role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

const createTestimonial = async (payload: ICreateTestimonialPayload, requester: ITestimonialRequester) => {
	const user = await prisma.user.findUnique({
		where: { id: requester.userId },
		select: { id: true, isDeleted: true },
	});

	if (!user || user.isDeleted) {
		throw new AppError(status.NOT_FOUND, "User not found");
	}

	const result = await prisma.testimonial.create({
		data: {
			title: payload.title,
			feedback: payload.feedback,
			rating: payload.rating,
			userId: requester.userId,
		},
	});

	return result;
};

const getTestimonials = async (query: IQueryParams, requester: ITestimonialRequester) => {
	if (!isAdminRole(requester.role)) {
		throw new AppError(status.FORBIDDEN, "Only admin or super admin can view all testimonials");
	}

	const queryBuilder = new QueryBuilder<
		Testimonial,
		Prisma.TestimonialWhereInput,
		Prisma.TestimonialInclude
	>(prisma.testimonial, query, {
		searchableFields: ["title", "feedback", "user.name", "user.email"],
		filterableFields: ["userId", "rating", "createdAt"],
	});

	const result = await queryBuilder
		.search()
		.filter()
		.include({
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		})
		.paginate()
		.sort()
		.execute();

	return result;
};

const getMyTestimonials = async (userId: string, query: IQueryParams) => {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true, isDeleted: true },
	});

	if (!user || user.isDeleted) {
		throw new AppError(status.NOT_FOUND, "User not found");
	}

	const queryBuilder = new QueryBuilder<
		Testimonial,
		Prisma.TestimonialWhereInput,
		Prisma.TestimonialInclude
	>(prisma.testimonial, query, {
		searchableFields: ["title", "feedback"],
		filterableFields: ["rating", "createdAt"],
	});

	const result = await queryBuilder
		.search()
		.filter()
		.where({ userId })
		.include({
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		})
		.paginate()
		.sort()
		.execute();

	return result;
};

const getTestimonialById = async (id: string, requester: ITestimonialRequester) => {
	const result = await prisma.testimonial.findUnique({
		where: { id },
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
				},
			},
		},
	});

	if (!result) {
		throw new AppError(status.NOT_FOUND, "Testimonial not found");
	}

	if (!isAdminRole(requester.role) && result.userId !== requester.userId) {
		throw new AppError(status.FORBIDDEN, "You can only view your own testimonials");
	}

	return result;
};

const updateTestimonial = async (
	id: string,
	payload: IUpdateTestimonialPayload,
	requester: ITestimonialRequester,
) => {
	const existingTestimonial = await prisma.testimonial.findUnique({
		where: { id },
		select: { id: true, userId: true },
	});

	if (!existingTestimonial) {
		throw new AppError(status.NOT_FOUND, "Testimonial not found");
	}

	if (payload.userId) {
		throw new AppError(status.BAD_REQUEST, "Testimonial ownership cannot be changed");
	}

	if (!isAdminRole(requester.role) && existingTestimonial.userId !== requester.userId) {
		throw new AppError(status.FORBIDDEN, "You can only update your own testimonials");
	}

	const result = await prisma.testimonial.update({
		where: { id },
		data: payload,
	});

	return result;
};

const deleteTestimonial = async (id: string, requester: ITestimonialRequester) => {
	const existingTestimonial = await prisma.testimonial.findUnique({
		where: { id },
		select: { id: true, userId: true },
	});

	if (!existingTestimonial) {
		throw new AppError(status.NOT_FOUND, "Testimonial not found");
	}

	if (!isAdminRole(requester.role) && existingTestimonial.userId !== requester.userId) {
		throw new AppError(status.FORBIDDEN, "You can only delete your own testimonials");
	}

	const result = await prisma.testimonial.delete({
		where: { id },
	});

	return result;
};

export const TestimonialService = {
	createTestimonial,
	getTestimonials,
	getMyTestimonials,
	getTestimonialById,
	updateTestimonial,
	deleteTestimonial,
};
