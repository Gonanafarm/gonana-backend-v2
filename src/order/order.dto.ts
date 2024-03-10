import {ApiProperty} from "@nestjs/swagger";
import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsEnum,
  ArrayNotEmpty,
  IsNotEmpty,
} from "class-validator";

export enum PaymentOptions {
  CASH = "cash",
  PAYSTACK = "wallet",
}

enum PaymentStatus {
  PENDING = "pending",
  AWAITING_PAYMENT = "awaiting-payment",
  COMPLETED = "completed",
}

export class Complaint {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  complaint: string;

  @IsString()
  @IsNotEmpty()
  subject: string;
}
