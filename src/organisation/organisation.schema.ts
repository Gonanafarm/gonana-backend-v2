import { Prop, Schema, raw, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";
import { Document } from "mongoose"
export type OrganizationDocument = Organization & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Organization {
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.ObjectId })
  id: string;
  @Prop({ type: mongoose.SchemaTypes.ObjectId, required: false, unique: true })
  publisher_id: string;

  // Meta
  @Prop({ type: mongoose.SchemaTypes.String })
  @ApiProperty()
  display_name: string;
  @Prop({ type: mongoose.SchemaTypes.String })
  @ApiProperty()
  handle: string;
  @Prop({ type: mongoose.SchemaTypes.String, unique: true })
  @ApiProperty()
  preferred_domain: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  about: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  vision_statement: string;

  // Social handles
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  facebook_handle: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  twitter_handle: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  instagram_handle: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  youtube_handle: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  linkedin_handle: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  website_handle: string;



  // Media
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  image: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  cover: string;


  // Location
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  country: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  state: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  address: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

