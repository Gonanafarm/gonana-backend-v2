import * as mongoose from "mongoose";
import {Document} from "mongoose";

export const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: "string",
      required: true,
      unique: true,
    },
    notification: [
      {
        body: {
          type: "string",
        },
      },
    ],
  },
  {timestamps: true, versionKey: false},
);

export interface NotificationDocument extends Document {
  userId: string;
  notification: Array<any>;
}
