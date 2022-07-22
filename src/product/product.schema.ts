import { Prop, Schema, raw, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";
import { IAddress, IPerson } from "../common/interface";

export type ProductDocument = Product & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
  id: true,
})
export class Product {

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.ObjectId })
  id: string;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, required: false })
  publisher_id: string;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
    default: "physical",
    required: true,
  })
  type: string;


  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  status: string;

  // biodata

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  name: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  handle: string;


  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  short_description: string;


  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  body: string;


  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  image: string;

  @ApiProperty()
  @Prop({
    type: [String]
  })
  collections: string[];

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Number })
  price: number;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  price_formated: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

