import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, Validate, IsDateString, IsNumber, IsEmpty, IsArray, ValidateIf, IsOptional } from 'class-validator';
import { isNull } from 'lodash';

export class PublishProductDto {
    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ required: true })
    @IsString()
    @IsNotEmpty()
    short_description: string;

    @ApiProperty({ required: true })
    @IsNumber()
    @IsNotEmpty()
    price: number;

    @ApiProperty({ enum: ['physical', 'digital'], default: "physical" })
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
    body: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    image: string;

    @ApiProperty({})
    @IsArray({})
    @IsOptional()
    collections: string[];


}

export class UpdateProductDto {
    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    short_description: string;

    @ApiProperty({ required: false })
    @IsNumber()
    @IsOptional()
    price: number;

    @ApiProperty({ enum: ['physical', 'digital'], default: "physical" })
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
    body: string;

    @ApiProperty({})
    @IsString()
    @IsOptional()
    image: string;

    @ApiProperty({})
    @IsArray({})
    @IsOptional()
    collections: string[];
}