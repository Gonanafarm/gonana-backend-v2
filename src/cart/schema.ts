import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsMongoId, IsNumber, IsString} from "class-validator";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
export type CartItemDocument = CartItem & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class CartItem {
  @Prop({type: mongoose.SchemaTypes.String, unique: true})
  publisher_id: string;

  @ApiProperty()
  @IsMongoId()
  @Prop({type: mongoose.SchemaTypes.Array, })
  product_id: string[];

  @ApiProperty()
  @IsNumber()
  @Prop({type: mongoose.SchemaTypes.Number, default: 1})
  quantity: number;

}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

CartItemSchema.virtual("id").get(function () {
  //@ts-ignore
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
CartItemSchema.set("toJSON", {
  virtuals: true,
});
