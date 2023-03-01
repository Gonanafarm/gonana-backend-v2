import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, Validate, IsDateString, IsNumber, IsEmpty, IsArray, ValidateIf, IsOptional, ValidateNested, IsEnum } from 'class-validator';
import { isNull } from 'lodash';
import { MediaAttachment } from './post.schema';

enum PostType {
    PRODUCT = 'product',
    POST = 'post',
}

enum PostStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
}

export class PublishPostDto {
    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiProperty({ enum: PostType, default: "post" })
    @IsEnum(PostType)
    @IsOptional()
    type: string;

    @ApiProperty({ enum: PostStatus, default: "draft" })
    @IsEnum(PostStatus)
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

    @ApiProperty({ type: MediaAttachment, isArray: true })
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