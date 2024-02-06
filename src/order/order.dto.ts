import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsEnum,
  ArrayNotEmpty,
} from 'class-validator';


export enum PaymentOptions {
  CASH = 'cash',
  PAYSTACK = 'wallet',
}

enum PaymentStatus {
  PENDING = 'pending',
  AWAITING_PAYMENT = 'awaiting-payment',
  COMPLETED = 'completed',
}
