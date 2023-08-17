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
  IsEnum,
  ArrayMaxSize,
} from "class-validator";
import {isNull} from "lodash";

export enum PostType {
  product = "product",
  post = "post",
}

export enum PostStatus {
  published = "published",
  draft = "draft",
}

export enum GeoLocationType {
  point = "Point",
}

class GeoLocation {
  @ApiProperty({default: GeoLocationType.point})
  @IsEnum(GeoLocationType)
  type: string;
  @ApiProperty()
  @IsArray()
  @ArrayMaxSize(2)
  coordinates: number[];
}

export class PublishPostDto {
  @ApiProperty({required: true})
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({required: true})
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiProperty({enum: PostType, default: PostType.post})
  @IsEnum(PostType)
  @IsOptional()
  type: string;

  @ApiProperty({enum: PostStatus, default: PostStatus.published})
  @IsEnum(PostStatus)
  @IsOptional()
  status: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  amount: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  quantity: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  geo_long: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  weight: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  geo_lat: string;

  @ApiProperty({})
  @IsString({})
  @IsOptional()
  category: string;

  @ApiProperty({})
  @IsArray({})
  @IsOptional()
  tags: string[];
}

export class UpdatePostDto {
  @ApiProperty({})
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  body: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  status: string;
}

export class UpdateAmountDto {
  @ApiProperty({required: true})
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({required: true})
  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
