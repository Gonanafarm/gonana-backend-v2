import {Moment} from "moment";
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
    farmer_id: {
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
    status: {
      type: String,
      default: "pending",
    },
    image: {
      type: Array,
      required: true,
    },
    payment_method: {
      type: String,
      required: true,
      enum: ["WEB2", "WEB3"],
    },
    self_shipping: {
      type: Boolean,
      required: true,
    },
    farmer_shipped: {
      type: Boolean,
      default: false,
      required: true,
    },
    customer_received: {
      type: Boolean,
      default: false,
      required: true,
    },
    customer_received_date: {
      type: Date,
      default: undefined,
    },
    farmer_ship_date: {
      type: Date,
      default: undefined,
    },
  },
  {timestamps: true, versionKey: false},
);

export interface IncomingOrderDocument extends Document {
  product_id: string;
  product_description: string;
  farmer_id: string;
  customer_id: string;
  product_name: string;
  product_amount: number;
  quantity: number;
  shipbubble_id: string;
  type?: "INCOMING";
  status:
    | "pending"
    | "confirmed"
    | "picked_up_from_farmer"
    | "in_transit"
    | "completed"
    | "cancelled";
  image: Array<string>;
  payment_method: "WEB2" | "WEB3";
  self_shipping: boolean;
  farmer_shipped: boolean;
  customer_received: boolean;
  farmer_ship_date: Date;
  customer_received_date: Date;
}
