import {ApiProperty} from "@nestjs/swagger";
import {
  IsString,
  IsObject,
  IsArray,
  IsOptional,
  IsEnum,
  ArrayNotEmpty,
  IsNumber,
} from "class-validator";
import {CartItem} from "./schema";

export class UpdateCartItemDto {
  @ApiProperty()
  @IsNumber()
  quantity: number;
}
