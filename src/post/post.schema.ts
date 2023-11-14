import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {IAddress, IPerson} from "../common/interface";
import {Document} from "mongoose";
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";
import {PostStatus, PostType} from "./post.dto";
export type PostDocument = Post & Document;

@Schema({})
class GeoLocation {
  @ApiProperty()
  @IsEnum([{point: "Point"}])
  @Prop({type: mongoose.SchemaTypes.String, default: "Point"})
  type: string;
  @Prop({type: mongoose.SchemaTypes.Number})
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(2)
  coordinates: number[];
}

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
  @Prop({type: mongoose.SchemaTypes.String, enum: PostType})
  type: string; // article , video, audio

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  title: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Array})
  images: string[];

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  body: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Array})
  tags: string[];

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, enum: PostStatus.published})
  status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number})
  amount: number;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number})
  quantity: number;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number})
  weight: number;

  @ApiProperty()
  @Prop({
    type: mongoose.SchemaTypes.String,
  })
  category: string;

  @ApiProperty()
  @Prop({
    type: [String],
  })
  categories: string[];

  @ApiProperty({type: GeoLocation})
  @Prop({type: mongoose.SchemaTypes.Mixed})
  location: GeoLocation;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  created_at: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  updated_at: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Array})
  address: Array<{address: string, code: number}>;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Boolean, default: false})
  self_shipping: boolean;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Array})
  likes: string[];

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Array})
  comments: object[];
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
