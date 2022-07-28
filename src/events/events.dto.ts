import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, Validate, IsDateString, IsNumber, IsEmpty, IsArray, ValidateIf, IsOptional } from 'class-validator';

export class PublishEventDto {
    @IsString()
    @ApiProperty({})
    type: string;

    @IsString()
    @ApiProperty({})
    title: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    body: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    short_description: string;

    @IsString()
    @IsOptional()
    @ApiProperty({default:"pending"})
    status: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    cover: string;

    @IsString()
    @IsOptional()
    @ApiProperty()
    start_date: Date;

    @IsString()
    @ApiProperty()
    @IsOptional()
    start_time: Date;

    @IsString()
    @ApiProperty()
    @IsOptional()
    end_date: Date;

    @IsString()
    @ApiProperty()
    @IsOptional()
    end_time: Date;

}

export class UpdateEventDto {
    @IsString()
    @IsOptional()
    @ApiProperty({})
    type: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    title: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    body: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    status: string;

    @IsString()
    @IsOptional()
    @ApiProperty({ required: false })
    cover: string;

    @IsString()
    @ApiProperty({})
    @IsOptional()
    short_description: string;
    

    @IsString()
    @IsOptional()
    @ApiProperty()
    start_date: Date;



    @IsString()
    @ApiProperty()
    @IsOptional()
    start_time: Date;

    @IsString()
    @ApiProperty()
    @IsOptional()
    end_date: Date;

    @IsString()
    @ApiProperty()
    @IsOptional()
    end_time: Date;
}