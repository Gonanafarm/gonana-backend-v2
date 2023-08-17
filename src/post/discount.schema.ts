import {Document, Schema} from "mongoose";

export const discountSchema = new Schema(
  {
    productid: {
      type: "string",
      required: true,
      unique: true,
    },
  },
  {timestamps: true, versionKey: false},
);

export interface DiscountDocument extends Document {
  productid: string;
}
