import { ContactMessageStatus } from "../../../generated/prisma/enums";

export interface ICreateContactPayload {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface IUpdateContactStatusPayload {
  status: ContactMessageStatus;
}

export interface IReplyContactPayload {
  subject: string;
  message: string;
}
