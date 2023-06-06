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
  IsMongoId,
  IsEnum,
} from "class-validator";
import {isNull} from "lodash";

enum TaxonomyContext {
  marketplace = "marketplace",
}

export class PublishTaxonomyDto {
  @IsEnum(TaxonomyContext)
  @ApiProperty({default: TaxonomyContext.marketplace, enum: TaxonomyContext})
  taxonomy_context: string;

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
  @ApiProperty({required: false})
  parent_id: string;

  @IsString()
  @IsOptional()
  @ApiProperty({required: false})
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
