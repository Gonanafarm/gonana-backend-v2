import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsString} from "class-validator";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
export type OrderDocument = Request & Document;

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
  amount: number;


  @Prop({type: mongoose.SchemaTypes.String, required: true})
  farmer_id: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true})
  product_description: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true})
  shipbubble_id: string;

  @Prop({
    type: mongoose.SchemaTypes.String,
    required: true,
    default: "OUTGOING",
  })
  type: string;

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
