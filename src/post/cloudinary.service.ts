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
  }
}
