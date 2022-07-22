import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, Validate, IsDateString, IsNumber, IsEmpty, IsArray, ValidateIf, IsOptional } from 'class-validator';
import { isNull } from 'lodash';

export class PublishTaxonomyDto {
    @IsString()
    @IsOptional()
    @ApiProperty({ default: "category" })
    type: string;

    @IsString()
    @IsNotEmpty()
    @ApiProperty({})
    name: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    description: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    parent_id: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    image: string;

    @IsString()
    @ApiProperty({ required: false })
    @IsOptional()
    as: string;

    @IsString()
    @ApiProperty({ required: false, default: "general" })
    @IsOptional()
    for: string;
}

export class UpdateTaxonomyDto {

    @IsString()
    @IsOptional()
    @ApiProperty({ default: "category" })
    type: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    name: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    description: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    parent_id: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    image: string;

    @IsString()
    @ApiProperty({ required: false })
    @IsOptional()
    as: string;

    @IsString()
    @ApiProperty({ required: false, default: "general" })
    @IsOptional()
    for: string;
}