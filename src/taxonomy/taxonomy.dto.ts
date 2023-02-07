import { ApiProperty } from '@nestjs/swagger';
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
  IsMongoId,
  IsEnum,
} from 'class-validator';
import { isNull } from 'lodash';

enum TaxonomyType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
}

enum TaxonomyContext {
  POS = 'pos',
  ONLINE = 'online',
  GLOBAL="global"
}

export class PublishTaxonomyDto {
  @ApiProperty({})
  @IsMongoId()
  branch_id: string;

  @ApiProperty({})
  @IsMongoId()
  org_id: string;

  @IsEnum(TaxonomyType)
  @ApiProperty({ default: 'manual', enum: TaxonomyType })
  type: string;

  @IsEnum(TaxonomyContext)
  @ApiProperty({ default: 'pos', enum: TaxonomyContext })
  Taxonomy_context: string;

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
}

export class UpdateTaxonomyDto {
 
  @IsString()
  @IsOptional()
  @ApiProperty({})
  name: string;

  @IsString()
  @ApiProperty({})
  @IsOptional()
  description: string;

}
