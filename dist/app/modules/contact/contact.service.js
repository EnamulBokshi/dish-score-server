import status from "http-status";
import { UserRole } from "../../../generated/prisma/client";
import { ContactMessageStatus } from "../../../generated/prisma/enums";
import { env } from "../../../config/env";
import AppError from "../../helpers/errorHelpers/AppError";
import prisma from "../../lib/prisma";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { sendEmail } from "../../utils/email";
const createContact = async (payload) => {
    const createdContact = await prisma.contactUs.create({
        data: payload,
    });
    try {
        await sendEmail({
            to: payload.email,
            subject: `We received your message - ${payload.subject}`,
            template: "contact-confirmation",
            templateData: {
                name: payload.name,
                subject: payload.subject,
                appName: "Dish Score",
                superAdminName: env.SUPER_ADMIN_NAME,
                superAdminEmail: env.SUPER_ADMIN_EMAIL,
            },
        });
    }
    catch (_error) {
        // Keep API semantics strict: only return success if confirmation email is sent.
        await prisma.contactUs.delete({ where: { id: createdContact.id } }).catch(() => {
            // Swallow cleanup errors to preserve original email failure.
        });
        throw new AppError(status.INTERNAL_SERVER_ERROR, "Contact request could not be completed because confirmation email failed");
    }
    return createdContact;
};
const getContacts = async (query) => {
    const queryBuilder = new QueryBuilder(prisma.contactUs, query, {
        searchableFields: ["id", "name", "email", "subject", "message"],
        filterableFields: ["id", "email", "status", "createdAt"],
        searchableExactFields: ["status"],
        searchableEnumFields: {
            status: Object.values(ContactMessageStatus),
        },
    });
    const result = await queryBuilder.search().filter().paginate().sort().execute();
    return result;
};
const getContactById = async (id) => {
    const contact = await prisma.contactUs.findUnique({
        where: { id },
    });
    if (!contact) {
        throw new AppError(status.NOT_FOUND, "Contact request not found");
    }
    return contact;
};
const updateContactStatus = async (id, payload, requester) => {
    if (requester.role !== UserRole.ADMIN && requester.role !== UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only admin or super admin can update contact status");
    }
    const existingContact = await prisma.contactUs.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!existingContact) {
        throw new AppError(status.NOT_FOUND, "Contact request not found");
    }
    const updatedContact = await prisma.contactUs.update({
        where: { id },
        data: {
            status: payload.status,
            respondedAt: payload.status === ContactMessageStatus.RESOLVED ? new Date() : null,
        },
    });
    return updatedContact;
};
const replyContact = async (id, payload, requester) => {
    if (requester.role !== UserRole.ADMIN && requester.role !== UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only admin or super admin can reply to contact requests");
    }
    const existingContact = await prisma.contactUs.findUnique({
        where: { id },
        select: {
            id: true,
            name: true,
            email: true,
        },
    });
    if (!existingContact) {
        throw new AppError(status.NOT_FOUND, "Contact request not found");
    }
    await sendEmail({
        to: existingContact.email,
        subject: payload.subject,
        template: "contact-reply",
        templateData: {
            name: existingContact.name,
            subject: payload.subject,
            message: payload.message,
            appName: "Dish Score",
            supportEmail: env.SUPER_ADMIN_EMAIL,
        },
    });
    const updatedContact = await prisma.contactUs.update({
        where: { id },
        data: {
            status: ContactMessageStatus.RESOLVED,
            respondedAt: new Date(),
        },
    });
    return updatedContact;
};
const deleteContact = async (id, requester) => {
    if (requester.role !== UserRole.ADMIN && requester.role !== UserRole.SUPER_ADMIN) {
        throw new AppError(status.FORBIDDEN, "Only admin or super admin can delete contact requests");
    }
    const existingContact = await prisma.contactUs.findUnique({
        where: { id },
        select: { id: true },
    });
    if (!existingContact) {
        throw new AppError(status.NOT_FOUND, "Contact request not found");
    }
    const deletedContact = await prisma.contactUs.delete({
        where: { id },
    });
    return deletedContact;
};
export const ContactService = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    replyContact,
    deleteContact,
};
