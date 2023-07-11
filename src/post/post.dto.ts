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
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty({})
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty({type: Number})
  @IsNumber()
  @IsOptional()
  geo_long: number

  @ApiProperty({type: Number})
  @IsNumber()
  @IsOptional()
  geo_lat: number

  @ApiProperty({})
  @IsArray({})
  @IsOptional()
  categories: string[];

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
