import { Prop, Schema, raw, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import * as mongoose from "mongoose";
import { Document } from "mongoose"

export type EventDocument = Event & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
})
export class Event {
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  publisher_id: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  type: string; // one-time , recurring

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  title: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  body: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  short_description: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  cover: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date })
  start_date: Date;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date })
  start_time: Date;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date })
  end_date: Date;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date })
  end_time: Date;

}

export const EventSchema = SchemaFactory.createForClass(Event);

