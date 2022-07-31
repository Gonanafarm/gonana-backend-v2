import { Prop, Schema, raw, SchemaFactory, } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";
import { IAddress, IPerson } from "../common/interface";
import {Document} from "mongoose"
export type PostDocument = Post & Document;

@Schema({})
class MediaAttachment {
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  file_type: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  source: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  source_id: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  content_url: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  name: string;

 
}


const attachmentDoc = SchemaFactory.createForClass(MediaAttachment);


@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  }
})
export class Post {
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
  short_description: string;

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
  @Prop({
    type: [String]
  })
  categories: string[];

  @ApiProperty({ type: MediaAttachment, isArray: true })
  @Prop({
    type: [attachmentDoc]
  })
  attachments: MediaAttachment[];

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  created_at: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  updated_at: string;
}




export const PostSchema = SchemaFactory.createForClass(Post);

