import * as mongoose from "mongoose";
import {Document} from "mongoose";

export const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: "string",
      required: true,
    },
    email: {
      type: "string",
      required: true,
    },
  },
  {timestamps: true, versionKey: false},
);

export interface OtpDocument extends Document {
  otp: string;
  email: string;
}

export function addTtlIndex(schema: mongoose.Schema): void {
  schema.index({createdAt: 1}, {expireAfterSeconds: 600}); // Expiry time in seconds (10 minutes)
}
