import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import {IsArray, IsString} from "class-validator";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
export type KYCApplicationDocument = Request & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class KYCApplication {
  @Prop({type: mongoose.SchemaTypes.String, unique: true})
  publisher_id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  identity_means: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, unique: true})
  identity_no: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, default: "pending"})
  status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  first_name: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  last_name: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  middle_name: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  phone_number: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  date_of_birth: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  gender: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  created_at: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  updated_at: string;
}

export const KYCApplicationSchema =
  SchemaFactory.createForClass(KYCApplication);
