import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class Wallet {
  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true, unique: true })
  userId: string;

  @Prop({ type: mongoose.SchemaTypes.String, required: true, unique: true })
  address: string;

  @Prop({ type: mongoose.SchemaTypes.String, required: true })
  encryptedPrivateKey: string;

  @Prop({ type: mongoose.SchemaTypes.String, default: '0' })
  balance: string;

  @Prop({ type: mongoose.SchemaTypes.String, default: '0' })
  escrowBalance: string;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);

// Index for faster lookups
WalletSchema.index({ userId: 1 });
WalletSchema.index({ address: 1 });
