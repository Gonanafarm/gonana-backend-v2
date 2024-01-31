import * as mongoose from "mongoose";
import {Document} from "mongoose";

export const tranSactionSchema = new mongoose.Schema(
  {
    userId: {
      type: "string",
      required: true,
    },
    transactions: [
      {
        Session_id: {
          type: "string",
        },
        Type: {
          type: "string",
          required: true,
          enum: ["CREDIT", "DEBIT", "ORDER DEBIT", "ORDER CREDIT"],
        },
        AmountSent: {
          type: "number",
        },
        AmountSettled: {
          type: "number",
          required: true,
        },
        narration: {
          type: "string",
        },
        Time: {
          type: "string",
          required: true,
          default: () => new Date().toISOString(),
        },
        productId: {
          type: "string",
        },
      },
    ],
  },
  {timestamps: true, versionKey: false},
);

export interface TransactionDocument extends Document {
  userId: string;
  transactions: Array<Record<string, any>>;
}
