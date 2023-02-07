import {Prop, Schema, raw, SchemaFactory} from "@nestjs/mongoose";
import {ApiProperty} from "@nestjs/swagger";
import * as mongoose from "mongoose";
import {Document} from "mongoose";
import {PaystackBankIntegrationSchema} from "../common/schema";
export type OrganizationDocument = Organization & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Organization {
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.ObjectId})
  id: string;
  @Prop({type: mongoose.SchemaTypes.ObjectId, required: false})
  publisher_id: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, default: "initial"})
  status: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String, default: "initial", unique: true})
  business_email: string;

  // Meta
  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  display_name: string;
  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  caption: string;
  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  handle: string;
  @Prop({type: mongoose.SchemaTypes.String, unique: true})
  @ApiProperty()
  preferred_domain: string;

  @Prop({type: mongoose.SchemaTypes.String, unique: true})
  @ApiProperty()
  custom_domain: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  about: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  vision_statement: string;

  // Social handles
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  facebook_handle: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  twitter_handle: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  instagram_handle: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  youtube_handle: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  linkedin_handle: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  website_handle: string;

  // Media
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  image: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  logo: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  cover: string;

  // Location
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  country: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  state: string;

  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  address: string;

  // Integrations
  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  google_analytics_code: string;

  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  fb_pixels_code: string;

  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  adsense_code: string;

  //going live
  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  fb_live_url: string;
  @Prop({type: mongoose.SchemaTypes.String})
  @ApiProperty()
  youtube_live_url: string;

  // bank account
  @ApiProperty({type: PaystackBankIntegrationSchema})
  @Prop({type: mongoose.SchemaTypes.Map})
  paystack_int: PaystackBankIntegrationSchema;

  // subscription
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  subscription_plan: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.Number})
  subscription_fee: number;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  subscription_status: String;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  subscription_code: string;
  @Prop({type: mongoose.SchemaTypes.String})
  email_token: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  subscription_interval: string;
  @ApiProperty()
  @Prop({type: mongoose.SchemaTypes.String})
  subscription_activated_on: string;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);
