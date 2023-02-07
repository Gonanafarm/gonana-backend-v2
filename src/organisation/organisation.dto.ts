import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDate, IsObject, ValidateIf, IsOptional, IsNumber } from 'class-validator';


export class PublishOrgDto {
    // Meta
    @IsString()
    @IsOptional()
    @ApiProperty({})
    display_name: string;
  
    @IsString()
    @IsOptional()
    @ApiProperty({})
    business_category: string;
  
    @IsString()
    @IsOptional()
    @ApiProperty({})
    business_email: string;
 
    @IsString()
    @IsOptional()
    @ApiProperty({})
    preferred_domain: string;
  
     
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
    logo: string;

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

    // going live
    fb_live_url: string;
    youtube_live_url: string;

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


export class UpdateOrganisationPreferredDomain {
    @IsString()
    @IsOptional()
    @ApiProperty({})
    preferred_domain: string;
}

export class UpdateOrganisationCustomDomain {
    @IsString()
    @IsOptional()
    @ApiProperty({})
    custom_domain: string;
}

export class UpdateOrganisationIntegrations {

    @IsString()
    @IsOptional()
    @ApiProperty({})
    google_analytics_code: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    fb_pixels_code: string;

    @IsString()
    @IsOptional()
    @ApiProperty({})
    adsense_code: string;
}