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
          enum: ["CREDIT", "DEBIT", "ORDER DEBIT", "ORDER CREDIT", "PENDING"],
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
        accountNumber: {
          type: "string",
        },
        currency: {
          type: "string",
          enum: ["CCD", "NGN"],
        },
        accountName: {
          type: "string",
        },
        bank: {
          type: "string",
        },
        recipientWallet: {
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
  transactions: Array<{
    Session_id?: string;
    Type:
      | "CREDIT"
      | "DEBIT"
      | "PENDING"
      | "ORDER DEBIT" /* Represents debits from orders*/
      | "ORDER CREDIT";
    productId?: string;
    Time: string;
    narration?: string;
    AmountSent: number;
    AmountSettled: number;
    accountNumber?: string;
    accountName?: string;
    bank?: string;
    currency?: "CCD" | "NGN";
    recipientWallet?: string;
  }>;
}
