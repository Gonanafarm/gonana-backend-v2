import {ApiProperty} from "@nestjs/swagger";
import {IsEnum, IsNumber, IsOptional, IsString, Length} from "class-validator";
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
  address: Array<Record<string, any>>
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

export class TransferFundsDto {
  @ApiProperty({})
  @IsString()
  @Length(12)
  requestReference: string;

  @ApiProperty({})
  @IsString()
  @Length(10)
  accountNumber: string;

  @ApiProperty({})
  @IsString()
  bankCode: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  narration: string;

  @ApiProperty({})
  @IsNumber()
  amount: number;
 
  @ApiProperty({})
  @IsString()
  nameEnquirySessionId: string;
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
  productId: string
}
