import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
import { UserPublicData } from './user.dto';

export type UserMethods = {
  getPublicData: () => UserPublicData;
};

export type UserDocument = User & Document & UserMethods;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class User {
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  email: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  phone: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  first_name: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  googleId: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  last_name: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: 'individual-account' })
  account_type: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  password: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  passwordResetToken: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Date })
  passwordResetExpires: Date;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationToken: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  activationExpires: Date;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: 'active' })
  account_status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: '' })
  profile_photo: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: '' })
  cover_photo: string;
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: '' })
  bio: string;

  @Prop({ type: mongoose.SchemaTypes.String, default: 'n/a' })
  technical_skill: string;

  // @ApiProperty()
  // @Prop({ type: mongoose.SchemaTypes.String })
  // subscription_plan: string;
  // @ApiProperty()
  // @Prop({ type: mongoose.SchemaTypes.String })
  // subscription_status: String;
  // @ApiProperty()
  // @Prop({ type: mongoose.SchemaTypes.Map })
  // subscription_transaction: any;
}

export const UserSchema = SchemaFactory.createForClass(User);

/**
 * Methods.
 */
UserSchema.methods.getPublicData = function () {
  const { id, email, first_name, last_name, profile_photo, cover_photo,account_type, bio, phone } = this;
  return {
    id,
    email,
    first_name,
    last_name,
    account_type,
    profile_photo,
    cover_photo,
    bio, phone
  };
};
