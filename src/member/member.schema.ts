import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
export type MemberDocument = Request & Document;

@Schema({
  timestamps: {
    createdAt: 'created_at', // Use `created_at` to store the created date
    updatedAt: 'updated_at', // and `updated_at` to store the last updated date
  },
})
export class Member {
  @Prop({ type:  mongoose.SchemaTypes.ObjectId })
  publisher_id: string;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, index: true })
  org_id: string;

  @Prop({ type: mongoose.SchemaTypes.ObjectId, index: true })
  user_id: string;

  @Prop({ type: mongoose.SchemaTypes.String })
  user_level: string;

  @Prop({ type: mongoose.SchemaTypes.String })
  user_role: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  fullname: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  phone: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  email: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  created_at: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  updated_at: string;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
