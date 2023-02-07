import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, Validate, IsDateString, IsNumber, IsEmpty, IsArray, ValidateIf, IsOptional, ValidateNested } from 'class-validator';
import { isNull } from 'lodash';

enum PostType {
    PRODUCT = 'product',
    POST = 'post',
}

enum PostStatus {
    PUBLISHED = 'published',
    DRAFT = 'draft',
}

class MediaAttachment {
    @ApiProperty()
    @IsString()
    @IsOptional()
    status: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    size: number;

    @ApiProperty()
    @IsString()
    @IsOptional()
    file_type: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    source: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    source_id: string;

    @ApiProperty()
    @IsString()
    @IsOptional()
    content_url: string;
    @ApiProperty()
    @IsString()
    @IsOptional()
    name: string;
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
    @IsString()
    @IsOptional()
    type: string;

    @ApiProperty({ enum: PostStatus, default: "draft" })
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


    @ApiProperty({ enum: PostType, default: "article" })
    @IsString()
    @IsOptional()
    type: string;

    @ApiProperty({})
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

    @ApiProperty({ type: MediaAttachment, isArray: true })
    @IsArray({})
    @IsOptional()
    // @ValidateNested({ each: true })
    attachments: MediaAttachment[];
}