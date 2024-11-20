import {Document} from "mongoose";
import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import * as mongoose from "mongoose";

export type TokenDocument = Document & Token;
@Schema({
  timestamps: true,
})
export class Token {
  @Prop({type: mongoose.SchemaTypes.Number})
  token: number;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
