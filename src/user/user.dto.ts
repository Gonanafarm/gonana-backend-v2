import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UserPublicData {
  @ApiProperty({})
  id: string;
  @ApiProperty({})
  email: string;
  @ApiProperty({})
  first_name: string;
  @ApiProperty({})
  last_name: string;
  @ApiProperty({})
  account_type: string;
  @ApiProperty({})
  profile_photo:string;
  @ApiProperty({})
  cover_photo:string;
  @ApiProperty({})
  phone:string;
}


export class UpdateUserDto {

  @IsString()
  @IsOptional()
  @ApiProperty({})
  first_name: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  last_name: string;
 
  @IsString()
  @IsOptional()
  @ApiProperty({})
  bio: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  profile_photo: string;

  @IsString()
  @IsOptional()
  @ApiProperty({})
  cover_photo:string;
}

