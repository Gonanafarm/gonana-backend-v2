import * as mongoose from "mongoose";
import {Document} from "mongoose";

export const incomingOrderSchema = new mongoose.Schema(
  {
    product_id: {
      type: String,
      required: true,
    },
    product_description: {
      type: String,
      required: true,
    },
    customer_id: {
      type: String,
      required: true,
    },
    product_name: {
      type: String,
      required: true,
    },
    product_amount: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    shipbubble_id: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
      default: "INCOMING",
    },
    status:{
    type: String,
    default: "pending"
    },
    image:{
      type: Array,
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
      enum: ["WEB2", "WEB3"],
    },
    self_shipping:{
      type: Boolean,
      required: true,
    }
  },
  {timestamps: true, versionKey: false},
);

export type IncomingOrderDocument = Request & Document 
