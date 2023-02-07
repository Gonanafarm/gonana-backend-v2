import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber } from 'class-validator';

export class AttachAccountDto {
  @IsString()
  @ApiProperty({})
  business_name: string;
  @IsString()
  @ApiProperty({})
  settlement_bank: string;
  @IsString()
  @ApiProperty({})
  account_number: string;
  @IsNumber()
  @ApiProperty({ default: 0 })
  percentage_charge: number;
  @IsString()
  @ApiProperty({})
  primary_contact_email: string;
  @IsString()
  @ApiProperty({})
  primary_contact_name: string;
  @IsString()
  @ApiProperty({})
  primary_contact_phone: string;
}
