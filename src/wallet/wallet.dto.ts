import {ApiProperty} from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsObject,
  Validate,
  IsDateString,
  IsNumber,
  IsEmpty,
  IsArray,
  ValidateIf,
  IsOptional,
  ValidateNested,
} from "class-validator";
import {isNull} from "lodash";

enum WalletType {
  PRODUCT = "product",
  Wallet = "Wallet",
}

enum WalletStatus {
  PUBLISHED = "published",
  DRAFT = "draft",
}

export class PublishWalletDto {
  @ApiProperty({required: true})
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({required: true})
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({enum: WalletType, default: "Wallet"})
  @IsString()
  @IsOptional()
  type: string;

  @ApiProperty({enum: WalletStatus, default: "draft"})
  @IsString()
  @IsOptional()
  status: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  image: string;

  @ApiProperty({})
  @IsArray({})
  @IsOptional()
  categories: string[];
}

export class WalletSendFundDto {
  @ApiProperty({})
  @IsString()
  @IsOptional()
  receipient_id: string;

  @ApiProperty({})
  @IsNumber()
  amount: number;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  status: string;
}
