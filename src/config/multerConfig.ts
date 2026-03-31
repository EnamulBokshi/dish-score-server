import {CloudinaryStorage} from "multer-storage-cloudinary";
import { cloudinaryUpload } from "./cloudinary";
import multer from "multer";
import { Request } from "express";


const storage = new CloudinaryStorage({
    
    cloudinary: cloudinaryUpload,
    params: async(req:Request, file) => {
        console.log("Received file for upload:", file.originalname, "Mimetype:", file.mimetype);
        const originalName =  file.originalname;
        const extension = originalName.split('.').pop()?.toLowerCase();
        
        const fileNameWithoutExt = originalName
        .split('.')
        .slice(0, -1)
        .join('.')
        .toLocaleLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/[^a-z0-9-]/g, ''); // Remove special characters except hyphens

        const uniqueName = Math.random().toString(36).substring(2)+"-"+Date.now()+"-"+fileNameWithoutExt;

        const folder = extension==="pdf"?"pdfs":"images";

        console.log(`Uploading file "${originalName}" as "${uniqueName}" to folder "${folder}" in Cloudinary.`);
        return {
            folder: `healthcare/${folder}`,
            public_id: uniqueName,
            format: extension,
            resource_type: "auto"
        }
    }

})



export const multerUpload = multer({storage: storage});