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
        Session_id: {type: "string", required: true},
        Type: {type: "string", required: true, enum: ["CREDIT", "DEBIT"]},
        AmountSent: {type: "number"},
        AmountSettled: {type: "number", required: true},
        narration:{type: "string"},
        Time: {type: "string", required: true},
      },
    ],
  },
  {timestamps: true, versionKey: false},
);

export interface TransactionDocument extends Document {
  userId: string;
  transactions: Array<Record<string, any>>;
}
