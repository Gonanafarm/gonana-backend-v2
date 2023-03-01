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

export class PublishWalletDto {

}

