import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {IAddress, IPerson} from "../common/interface";
import {Document} from "mongoose";
import { ArrayMaxSize, IsArray, IsEnum, IsNumber, IsOptional, IsString, MaxLength } from "class-validator";
export type PostDocument = Post & Document;

@Schema({})
class GeoLocation {
  @ApiProperty()
  @IsEnum([{point:"Point"}])
  @Prop({type: mongoose.SchemaTypes.String, default:"Point"})
  type: string;
  @Prop({type: mongoose.SchemaTypes.Number})
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(2)
  coordinates: number[];
}

@Schema({})
export class MediaAttachment {
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number})
  @IsNumber()
  @IsOptional()
  size: number;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Prop({type: mongoose.SchemaTypes.String})
  file_type: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Prop({type: mongoose.SchemaTypes.String})
  source: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  @Prop({type: mongoose.SchemaTypes.String})
  content_url: string;
}

const attachmentDoc = SchemaFactory.createForClass(MediaAttachment);
const locationDoc = SchemaFactory.createForClass(GeoLocation);
@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Post {
  @Prop({type: mongoose.SchemaTypes.String})
  publisher_id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  type: string; // article , video, audio

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  name: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  image: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  body: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number})
  amount: number;

  @ApiProperty()
  @Prop({
    type: [String],
  })
  categories: string[];

  @ApiProperty({type: MediaAttachment, isArray: true})
  @Prop({
    type: [attachmentDoc],
  })
  attachments: MediaAttachment[];

  @ApiProperty({type: GeoLocation})
  @Prop({type: GeoLocation})
  location: GeoLocation;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  created_at: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  updated_at: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);



PostSchema.virtual("id").get(function () {
  //@ts-ignore
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
PostSchema.set("toJSON", {
  virtuals: true,
});