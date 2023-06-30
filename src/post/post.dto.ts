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
import {MediaAttachment} from "./post.schema";

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
  image: string;

  @ApiProperty({})
  @IsNumber()
  @IsOptional()
  amount: number;

  @ApiProperty({})
  @IsNumber()
  @IsOptional()
  quantity: number;

  @ApiProperty({type: GeoLocation})
  @IsObject()
  location: GeoLocation;

  @ApiProperty({})
  @IsArray({})
  @IsOptional()
  categories: string[];

  @ApiProperty({})
  @IsArray({})
  @IsOptional()
  tags: string[];

  @ApiProperty({type: MediaAttachment, isArray: true})
  @IsArray({})
  @IsOptional()
  // @ValidateNested({ each: true })
  attachments: MediaAttachment[];
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
