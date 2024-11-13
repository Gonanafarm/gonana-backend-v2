import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import {IsString} from "class-validator";
import * as mongoose from "mongoose";
import {Document} from "mongoose";

export interface MessageDocument extends Document {
  senderId: string;
  receiverId: string;
  isUrl: boolean;
  channel: string;
  message: string;
}

@Schema({
  timestamps: {
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
})
export class Message {
  @Prop({type: mongoose.SchemaTypes.String, required: true, trim: true})
  senderId: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true, trim: true})
  receiverId: string;

  @Prop({type: mongoose.SchemaTypes.Boolean, required: true, default: false})
  isUrl: boolean;

  @Prop({type: mongoose.SchemaTypes.String, required: true, trim: true})
  channel: string;

  @Prop({type: mongoose.SchemaTypes.String, required: true, trim: true})
  message: string;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.virtual("id").get(function () {
    //@ts-ignore
    return this._id.toHexString();
  });
  
  // Ensure virtual fields are serialised.
  MessageSchema.set("toJSON", {
    virtuals: true,
  });