import { Prop, Schema, raw, SchemaFactory, } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {Document} from "mongoose"
export type WalletTransactionDocument = WalletTransaction & Document;


@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  }
})
export class WalletTransaction {
  @Prop({ type: mongoose.SchemaTypes.String })
  publisher_id: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String})
  type: string; // article , video, audio

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  title: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  image: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  body: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Number })
  amount: number;

  @ApiProperty()
  @Prop({
    type: [String]
  })
  categories: string[];

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  created_at: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  updated_at: string;
}




export const WalletTransactionSchema = SchemaFactory.createForClass(WalletTransaction);

