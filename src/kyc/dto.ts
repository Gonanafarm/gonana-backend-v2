import {ApiProperty} from "@nestjs/swagger";
import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsEnum,
  ArrayNotEmpty,
} from "class-validator";

enum KYCEnrollmentMeans {
  NIN = "virtual_nin",
  VOTERCARD = "voter",
}

export class EnrollKYCDto {
  @IsEnum(KYCEnrollmentMeans)
  @ApiProperty({enum: KYCEnrollmentMeans})
  identity_means:  string;

  @IsString()
  @ApiProperty()
  identity_no: string;

  @IsString()
  @ApiProperty()
  first_name: string;
  @IsString()
  @ApiProperty()
  last_name: string;
  @IsString()
  @ApiProperty()
  middle_name: string;
  @IsString()
  @ApiProperty()
  phone_number: string;
  @IsString()
  @ApiProperty()
  date_of_birth: string;
  @IsString()
  @ApiProperty()
  gender: string;
}
