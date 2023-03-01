import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsMongoId, IsNumber, IsString} from "class-validator";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
export type CartItemDocument = Request & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class CartItem {
  @Prop({type: mongoose.SchemaTypes.String})
  publisher_id: string;

  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  @IsString()
  image: string;
  @ApiProperty()
  @IsString()
  @Prop({type: mongoose.SchemaTypes.String})
  product_name: string;

  @ApiProperty()
  @IsMongoId()
  @Prop({type: mongoose.SchemaTypes.ObjectId})
  farmer_id: string;

  @ApiProperty()
  @IsMongoId()
  @Prop({type: mongoose.SchemaTypes.ObjectId})
  product_id: string;

  @ApiProperty()
  @IsNumber()
  @Prop({type: mongoose.SchemaTypes.Number})
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Prop({type: mongoose.SchemaTypes.Number})
  amount: number;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  updated_at: string;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);
