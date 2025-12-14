import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import * as mongoose from 'mongoose';

export type EscrowOrderDocument = EscrowOrder & Document;

export enum EscrowStatus {
  CREATED = 'CREATED',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  REFUNDED = 'REFUNDED',
  DISPUTED = 'DISPUTED',
}

@Schema({
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },
})
export class EscrowOrder {
  @Prop({ required: true, unique: true })
  orderId: string; // ID from Smart Contract

  @Prop({ type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true })
  buyerId: string; // Database User ID

  @Prop({ required: true })
  buyerAddress: string;

  @Prop({ required: true })
  sellerAddress: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true, enum: EscrowStatus, default: EscrowStatus.CREATED })
  status: EscrowStatus;

  @Prop({ required: true })
  txHash: string; // Creation transaction hash
}

export const EscrowOrderSchema = SchemaFactory.createForClass(EscrowOrder);

// Indexes
EscrowOrderSchema.index({ buyerId: 1 });
EscrowOrderSchema.index({ buyerAddress: 1 });
EscrowOrderSchema.index({ sellerAddress: 1 });
