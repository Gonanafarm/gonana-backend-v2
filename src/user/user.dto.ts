import {ApiProperty} from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
} from "class-validator";
import {AccountStatus} from "../common/enums";

export class UserPublicData {
  @ApiProperty({})
  id: string;

  @ApiProperty({})
  email: string;

  @ApiProperty({type: Boolean})
  email_activated: boolean;

  @ApiProperty({})
  first_name: string;

  @ApiProperty({})
  last_name: string;

  @ApiProperty({})
  account_type: string;

  @ApiProperty({})
  account_status: string;

  @ApiProperty({})
  profile_photo: string;

  @ApiProperty({})
  cover_photo: string;

  @ApiProperty({})
  bio: string;

  @ApiProperty({})
  phone: string;

  @ApiProperty({})
  address: Array<Record<string, any>>;

  @ApiProperty({})
  virtual_account_number: string;

  @ApiProperty({})
  virtual_account_bank_name: string;

  @ApiProperty({})
  virtual_account_name: string;

  @ApiProperty({})
  country: string;

  @ApiProperty({})
  onesignal_id: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty({})
  first_name: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  last_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  bio: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  phone: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  profile_photo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  cover_photo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  @Length(11)
  bvn: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  country: string;
}

export class GetUserTransactonsDto {
  @IsString()
  @IsOptional()
  limit: string;

  @IsString()
  @IsOptional()
  page: string;
}

export class sendNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

export class UpdateTransferReceipient {
  @ApiProperty({})
  @IsString()
  name: string;
  @ApiProperty({})
  @IsString()
  bank_code: string;
  @ApiProperty({})
  @IsString()
  account_number: string;
}

export class ResolveAccountNumber {
  @ApiProperty({})
  @IsString()
  @Length(10)
  account_number: string;
  @ApiProperty({})
  @IsString()
  bank: string;
}

export class TransferToUser {
  @ApiProperty({})
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  narration: string;

  @ApiProperty({})
  @IsNumber()
  amount: number;
}

export class TransferFundsDto {
  @ApiProperty({})
  @IsString()
  @Length(10)
  accountNumber: string;

  @ApiProperty({})
  @IsString()
  bankName: string;

  @ApiProperty({})
  @IsString()
  accountName: string;
  
  @ApiProperty({})
  @IsString()
  @IsOptional()
  narration: string;

  @ApiProperty({})
  @IsNumber()
  amount: number;
}

export class UpdateAccountStatus {
  @ApiProperty({enum: AccountStatus})
  @IsEnum(AccountStatus)
  account_status: string;
}

export class UpdateDriverAccountStatus {
  @ApiProperty({enum: AccountStatus})
  @IsEnum(AccountStatus)
  driver_account_status: string;
}

export class ValidatePostAdress {
  @IsString()
  address: string;
  @IsString()
  productId: string;
}

export class TransferEthDto {
  @IsNumberString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}

export class VerifyPasscodeOtpDto {
  @IsString()
  @Length(4)
  otp: string;
  @IsString()
  @Length(4)
  passcode: string;
}

export interface ShipmentData {
  request_token: string;
  service_code: string;
  courier_id: string;
  insurance_code?: string;
}
