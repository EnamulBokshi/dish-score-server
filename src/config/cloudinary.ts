import {v2 as cloudinary, UploadApiResponse} from "cloudinary";

import { env } from "./env";
import AppError from "../app/helpers/errorHelpers/AppError";


cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET,
});


export const deleteFileCloudinary = async(url: string)=> {
    try {
        
        const regex = /\/v\d+\/(.+?)(?:\.[a-zA-Z0-9]+)+$/;
        const match = url.match(regex);
        if(match && match[1]){
            const publicId = match[1];
            await cloudinary.uploader.destroy(publicId, {resource_type: "image"});
            console.log(`File with public ID ${publicId} deleted successfully from Cloudinary.`);
        }
        
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
        throw new AppError(500, "Failed to delete file from Cloudinary");
    }

}


export const uploadFileToCloudinary = async(buffer: Buffer, fileName: string, ):Promise<UploadApiResponse> => {
    if(!buffer || !fileName){
        throw new AppError(400, "File buffer and file name are required for upload");
    }
        const extension = fileName.split('.').pop()?.toLowerCase();
        
        const fileNameWithoutExt = fileName
        .split('.')
        .slice(0, -1)
        .join('.')
        .toLocaleLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters except hyphens

        const uniqueName = Math.random().toString(36).substring(2)+"-"+Date.now()+"-"+fileNameWithoutExt;

        const folder = extension==="pdf"?"pdfs":"images";

return  new Promise((resolve, reject)=> {
    cloudinary.uploader.upload_stream(
        {
            resource_type: "auto",
            public_id: `healthcare/${folder}/${uniqueName}`,
            folder: `healthcare/${folder}`,

        },
        (error, result) => {
            if(error){
                return reject(new AppError(500, "Failed to upload file to Cloudinary"));
            }
            resolve(result as UploadApiResponse);
        }
    ).end(buffer);
})

}
export const cloudinaryUpload = cloudinary;