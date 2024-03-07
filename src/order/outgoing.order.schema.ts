import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {IsString} from "class-validator";
import {Moment} from "moment";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
export interface OrderDocument extends Document {
  image: string[];
  product_name: string;
  product_id: string;
  quantity: number;
  product_amount: number;
  customer_id: string;
  farmer_id: string;
  product_description: string;
  shipbubble_id: string;
  self_shipping: boolean;
  farmer_shipped?: boolean;
  customer_received?: boolean;
  farmer_ship_date?: Moment;
  customer_received_date?: Moment;
  type?: "OUTGOING";
  status:
    | "pending"
    | "confirmed"
    | "picked_up_from_farmer"
    | "in_transit"
    | "completed"
    | "cancelled";
  payment_method: "WEB2" | "WEB3";
}

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Order {
  @Prop({type: mongoose.SchemaTypes.Array, required: true})
  @ApiProperty()
  image: string[];

  @ApiProperty()
  @IsString()
  @Prop({type: mongoose.SchemaTypes.String, required: true})
  product_name: string;

  @ApiProperty()
  @IsString()
  @Prop({type: mongoose.SchemaTypes.String, required: true})
  product_id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number, required: true})
  quantity: number;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number, required: true})
  product_amount: number;

  @Prop({type: mongoose.SchemaTypes.String, required: true})
  farmer_id: string;

  @Prop({type: mongoose.SchemaTypes.Boolean, required: true, default: false})
  farmer_shipped: boolean;

  @Prop({type: mongoose.SchemaTypes.Boolean, required: true, default: false})
  customer_received: boolean;

  @Prop({type: mongoose.SchemaTypes.String, default: undefined})
  customer_received_date: Moment;

  @Prop({type: mongoose.SchemaTypes.String, default: undefined})
  farmer_ship_date: Moment;

  @Prop({type: mongoose.SchemaTypes.String, required: true})
  product_description: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true})
  shipbubble_id: string;

  @Prop({type: mongoose.SchemaTypes.Boolean, required: true})
  self_shipping: boolean;

  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
    default: "OUTGOING",
  })
  type: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true, default: "pending"})
  status: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true})
  customer_id: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    enum: ["WEB2", "WEB3"],
    required: true,
  })
  payment_method: string;
}

export const OutgoingOrderSchema = SchemaFactory.createForClass(Order);

OutgoingOrderSchema.virtual("id").get(function () {
  //@ts-ignore
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
OutgoingOrderSchema.set("toJSON", {
  virtuals: true,
});
