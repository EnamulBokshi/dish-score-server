
import ejs from 'ejs'
import nodemailer from 'nodemailer'
import { env } from '../../config/env'
import AppError from '../helpers/errorHelpers/AppError';
import path from 'node:path';

const transporter = nodemailer.createTransport({
    host: env.SMTP_SENDER.HOST,
    port: env.SMTP_SENDER.PORT,
    secure: env.SMTP_SENDER.PORT === 465, // true for 465, false for other ports
    auth: {
        user: env.SMTP_SENDER.USER,
        pass: env.SMTP_SENDER.PASSWORD,
    },
})

interface SendEmailOptions {
    to: string;
    subject: string;
    template: string;
    templateData: Record<string, any>;
    attachments?:{
        filename: string;
        content: Buffer | string;   
        contentType: string;
    }[];
}

export const sendEmail = async(options: SendEmailOptions) => {

    const {to, subject, template, templateData, attachments} = options;
    try {
        
        const templatePath = path.resolve(process.cwd(), `src/templates/${template}.ejs`);
        const html = await ejs.renderFile(templatePath, templateData);

        const info = await transporter.sendMail({
            from: env.SMTP_SENDER.USER,
            to,
            subject,
            html,
            attachments: attachments?.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
            })),
        });
        
        console.log("Email sent:", info.messageId);
    } catch (error) {
        console.log("Error sending email:", error);
        throw new AppError(500, "Error sending email");
    }
}