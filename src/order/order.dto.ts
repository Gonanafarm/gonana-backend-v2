import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator';
import { OrderItem } from './order.schema';

enum PaymentOptions {
  CASH = 'cash',
  PAYSTACK = 'paystack',
}

enum PaymentStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting-payment',
  COMPLETED = 'completed',
}
export class PublishOrderDto {
  @ApiProperty({ type: OrderItem, isArray: true })
  @IsArray({})
  @ArrayNotEmpty()
  @IsOptional()
  items: OrderItem[];

  @ApiProperty({})
  @IsString()
  customer_id: string;

  @ApiProperty({ enum: PaymentOptions, default: 'cash' })
  @IsEnum(PaymentOptions)
  payment_method: string;

  @ApiProperty({ enum: PaymentStatus, default: 'pending' })
  @IsEnum(PaymentStatus)
  payment_status: string;

  @ApiProperty({})
  @IsString()
  branch_id: string;

  @ApiProperty({})
  @IsString()
  org_id: string;
}
