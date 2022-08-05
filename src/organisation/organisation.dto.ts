import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, ValidateIf, IsOptional, IsNumber } from 'class-validator';

export class UpdateOrganizationDto {

    @IsString()
    @IsOptional()
    @ApiProperty({})
    id: string;

    // Meta
    @IsString()
    @IsOptional()
    @ApiProperty({})
    display_name: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    handle: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    preferred_domain: string;


    @IsString()
    @IsOptional()
    @ApiProperty({})
    about: string;


    @IsString()
    @IsOptional()
    @ApiProperty({})
    vision_statement: string;


    // Social handles

    @IsString()
    @IsOptional()
    @ApiProperty({})
    facebook_handle: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    twitter_handle: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    instagram_handle: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    youtube_handle: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    linkedin_handle: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    website_handle: string;



    // Media

    @IsString()
    @IsOptional()
    @ApiProperty({})
    image: string;


    @IsString()
    @IsOptional()
    @ApiProperty({})
    cover: string;


    // Location

    @IsString()
    @IsOptional()
    @ApiProperty({})
    country: string;


    @IsString()
    @IsOptional()
    @ApiProperty({})
    state: string;


    @IsString()
    @IsOptional()
    @ApiProperty({})
    address: string;


}


export class AttachAccountDto {
    @IsString()
    @ApiProperty({})
    business_name: string;
    @IsString()
    @ApiProperty({})
    settlement_bank: string;
    @IsString()
    @ApiProperty({})
    account_number: string;
    @IsNumber()
    @ApiProperty({ default: 0 })
    percentage_charge: number;
    @IsString()
    @ApiProperty({})
    primary_contact_email: string;
    @IsString()
    @ApiProperty({})
    primary_contact_name: string;
    @IsString()
    @ApiProperty({})
    primary_contact_phone: string;
}