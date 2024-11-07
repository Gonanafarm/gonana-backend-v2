import {ApiProperty} from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  isNotEmpty,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  IsOptional,
  IsString,
  Length,
  Matches,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {AccountStatus} from "../common/enums";

export function Trim(validationOptions?: ValidationOptions) {
  return function (object: Record<any, any>, propertyName: string) {
    registerDecorator({
      name: "trim",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value === "string") {
            args.object[propertyName] = value.trim();
          }
          return true;
        },
      },
    });
  };
}

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

  @ApiProperty({})
  firebaseToken: string;
}

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  @ApiProperty({})
  @Trim()
  first_name: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  @Trim()
  last_name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  @Trim()
  bio: string;

  @IsString()
  @IsOptional()
  @Trim()
  @ApiProperty({})
  phone: string;

  @IsString()
  @IsOptional()
  @Trim()
  @ApiProperty({})
  profile_photo: string;

  @IsString()
  @Trim()
  @IsOptional()
  @ApiProperty({})
  cover_photo: string;

  @IsString()
  @IsOptional()
  @Trim()
  @ApiProperty({})
  @Length(11)
  bvn: string;

  @IsString()
  @IsOptional()
  @Trim()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  @Trim()
  @IsNotEmpty()
  firebaseToken: string;
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
  @Trim()
  title: string;

  @IsString()
  @Trim()
  @IsOptional()
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
  @Trim()
  @Length(10)
  account_number: string;

  @ApiProperty({})
  @Trim()
  @IsString()
  bank: string;
}

export class TransferToUser {
  @ApiProperty({})
  @IsString()
  @Trim()
  @IsEmail()
  email: string;

  @ApiProperty({})
  @IsString()
  @Trim()
  @IsOptional()
  narration: string;

  @ApiProperty({})
  @IsNumber()
  amount: number;
}

export class TransferFundsDto {
  @ApiProperty({})
  @IsString()
  @Trim()
  @Length(10)
  accountNumber: string;

  @ApiProperty({})
  @Trim()
  @IsString()
  bankName: string;

  @ApiProperty({})
  @IsString()
  @Trim()
  accountName: string;

  @ApiProperty({})
  @IsString()
  @Trim()
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
  @Trim()
  address: string;

  @IsString()
  @Trim()
  productId: string;
}

export class TransferEthDto {
  @IsNumberString()
  @Trim()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  address: string;
}

export class VerifyPasscodeOtpDto {
  @IsString()
  @Trim()
  @Length(4)
  otp: string;

  @IsString()
  @Trim()
  @Length(4)
  passcode: string;
}

export interface ShipmentData {
  request_token: string;
  service_code: string;
  courier_id: string;
  insurance_code?: string;
}

export class KycVerification {
  @IsString()
  @Length(11)
  @IsNotEmpty()
  bvn: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[0-9]{2}-[A-Z]{3}-[0-9]{4}$/, {
    message: "DOB must be in the format DD-MMM-YYYY (e.g., 30-OCT-2001)",
  })
  dob: string;
}
