import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';
export type OrderDocument = Request & Document;

@Schema({
  timestamps: {
    createdAt: 'created_at', // Use `created_at` to store the created date
    updatedAt: 'updated_at', // and `updated_at` to store the last updated date
  },
})
export class OrderItem {
  @Prop({ type: mongoose.SchemaTypes.String })
  @ApiProperty()
  @IsString()
  image: string;
  @ApiProperty()
  @IsString()
  @Prop({ type: mongoose.SchemaTypes.String })
  product_name: string;

  @ApiProperty()
  @IsString()
  @Prop({ type: mongoose.SchemaTypes.ObjectId })
  product_id: string;

  @ApiProperty()
  @IsString()
  @Prop({ type: mongoose.SchemaTypes.Number })
  quantity: number;

  @ApiProperty()
  @IsString()
  @Prop({ type: mongoose.SchemaTypes.String })
  amount: number;

  @ApiProperty()
  @IsString()
  @Prop({ type: mongoose.SchemaTypes.String })
  total: number;
}

const orderItemsAttachmentDoc = SchemaFactory.createForClass(OrderItem);

@Schema({
  timestamps: {
    createdAt: 'created_at', // Use `created_at` to store the created date
    updatedAt: 'updated_at', // and `updated_at` to store the last updated date
  },
})
export class Order {

  @Prop({ type: mongoose.SchemaTypes.String })
  org_id: string;

  @Prop({ type: mongoose.SchemaTypes.String, default: 'anonymous' })
  customer_id: string;

  @Prop({ type: mongoose.SchemaTypes.String })
  publisher_id: string;

  @ApiProperty({ type: OrderItem, isArray: true })
  @Prop({
    type: [orderItemsAttachmentDoc],
  })
  items: OrderItem[];

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.Number })
  sum_total: number;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: 'cash' })
  payment_method: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  payment_url: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: 'pending' })
  payment_status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String, default: 'pending' })
  status: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  created_at: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  updated_at: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
