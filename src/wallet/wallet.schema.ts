import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {IAddress, IPerson} from "../common/interface";
import {Document} from "mongoose";
export type WalletDocument = Wallet & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Wallet {
  @Prop({type: mongoose.SchemaTypes.String})
  user_id: string;

  @Prop({type: mongoose.SchemaTypes.String})
  account_number: string;

  @Prop({type: mongoose.SchemaTypes.Number})
  balance: number;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
