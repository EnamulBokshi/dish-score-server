import { Request, Response } from "express";
import catchAsync from "../../helpers/catchAsync";
import { sendResponse } from "../../helpers/sendResponse";
import { ContactService } from "./contact.service";

const createContact = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await ContactService.createContact(payload);

  sendResponse(res, {
    httpStatusCode: 201,
    success: true,
    data: result,
    message: "Contact request created successfully",
  });
});

const getContacts = catchAsync(async (req: Request, res: Response) => {
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

const getContactById = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const result = await ContactService.getContactById(id as string);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Contact request retrieved successfully",
  });
});

const updateContactStatus = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id;
  const payload = req.body;
  const result = await ContactService.updateContactStatus(id as string, payload, req.user);

  sendResponse(res, {
    httpStatusCode: 200,
    success: true,
    data: result,
    message: "Contact request status updated successfully",
  });
});

export const ContactController = {
  createContact,
  getContacts,
  getContactById,
  updateContactStatus,
};
