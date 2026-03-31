import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { ContactService } from "./contact.service";
const createContact = catchAsync(async (req, res) => {
    const payload = req.body;
    const result = await ContactService.createContact(payload);
    sendResponse(res, {
        httpStatusCode: 201,
        success: true,
        data: result,
        message: "Contact request created successfully",
    });
});
const getContacts = catchAsync(async (req, res) => {
    const query = req.query;
    const result = await ContactService.getContacts(query);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result.data,
        meta: result.meta,
        message: "Contact requests retrieved successfully",
    });
});
const getContactById = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ContactService.getContactById(id);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Contact request retrieved successfully",
    });
});
const updateContactStatus = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await ContactService.updateContactStatus(id, payload, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Contact request status updated successfully",
    });
});
const replyContact = catchAsync(async (req, res) => {
    const id = req.params.id;
    const payload = req.body;
    const result = await ContactService.replyContact(id, payload, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Contact reply sent successfully",
    });
});
const deleteContact = catchAsync(async (req, res) => {
    const id = req.params.id;
    const result = await ContactService.deleteContact(id, req.user);
    sendResponse(res, {
        httpStatusCode: 200,
        success: true,
        data: result,
        message: "Contact request deleted successfully",
    });
});
export const ContactController = {
    createContact,
    getContacts,
    getContactById,
    updateContactStatus,
    replyContact,
    deleteContact,
};
