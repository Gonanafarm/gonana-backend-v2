import {Injectable} from "@nestjs/common";
import {
  UploadApiErrorResponse,
  UploadApiResponse,
  v2,
  UploadStream,
} from "cloudinary";
import toStream = require("buffer-to-stream");
@Injectable()
export class CloudinaryService {
  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
   
    return new Promise((resolve, reject) => {
      const upload = v2.uploader.upload_stream(
        {upload_preset: "image_preset"},
        (error, result) => {
          if (error) return reject(error);
          //@ts-ignore
          resolve(result);
        },
      );
      toStream(file.buffer).pipe(upload);
    });
  }async uploadFile(
    file: Express.Multer.File,
  ): Promise<UploadApiResponse | UploadApiErrorResponse> {
    try {
      const fileStream = toStream(file.buffer);
      
      const uploadOptions = {
        resource_type: 'auto' as const,
        folder: 'Gonana/images'
      };
      
      const result = await new Promise<UploadApiResponse>((resolve, reject) => {
        const upload = v2.uploader.upload_stream(
          uploadOptions,
          (error, result) => {
            if (error) {
              console.error('Upload error:', error);
              reject(error);
            }
            resolve(result);
          }
        );
        fileStream.pipe(upload);
      });
      
      return result;
    } catch (error) {
      console.error('Upload failed:', error);
      throw new Error(`File upload failed: ${error.message}`);
    }
  }
}
