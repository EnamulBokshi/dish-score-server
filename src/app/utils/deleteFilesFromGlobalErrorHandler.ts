import { Request } from "express";
import { deleteFileCloudinary } from "../../config/cloudinary";
export const deleteFileFromGlobalErrorHandler = async (req: Request) => {
  try {
    const filesToDelete: string[] = [];

    if (req.file && req.file.path) {
      filesToDelete.push(req.file.path);
    } else if (
      req.files &&
      typeof req.files === "object" &&
      !Array.isArray(req.files)
    ) {
      Object.values(req.files).forEach((fileArray) => {
        if (Array.isArray(fileArray)) {
          fileArray.forEach((file) => {
            if (file.path) {
              filesToDelete.push(file.path);
            }
          });
        }
      });
    }
    else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
        req.files.forEach((file) => {
            if (file.path) {
                filesToDelete.push(file.path);
            }
        });
    }

    if(filesToDelete.length > 0){
        await Promise.all(filesToDelete.map((url) => deleteFileCloudinary(url)));
    }
  } catch (error: unknown) {
    console.error("Error deleting file in global error handler:", error);
  }
};



