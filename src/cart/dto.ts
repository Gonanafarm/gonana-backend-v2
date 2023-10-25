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

export class AddToCartDto{
  @ApiProperty({})
  @IsArray()
  orders:  Array<{id:string, units:number}>;
  @ApiProperty({})
  @IsString()
  service_code: string;
}

export class PlaceOrderDto{
  @IsArray()
  orders: Array<{id:string, units:number}>;
  @IsString()
  service_code: string;
}
