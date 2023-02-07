import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsMongoId } from 'class-validator';

enum MemberRoles {
  SUPER_ADMIN = 'super-admin',
  ADMIN = 'admin',
  STAFF = 'staff',
}
export class PublishMemberDto {
  @ApiProperty({})
  @IsMongoId()
  branch_id: string;

  @ApiProperty({})
  @IsMongoId()
  org_id: string;

  @ApiProperty({})
  @IsMongoId()
  user_id: string;

  @ApiProperty({})
  @IsString()
  fullname: string;

  @ApiProperty({})
  @IsString()
  email: string;

  @ApiProperty({})
  @IsString()
  phone: string;

  @ApiProperty({})
  @IsString()
  user_level: string;
  @ApiProperty({ enum: MemberRoles })
  @IsEnum(MemberRoles)
  user_role: string;
}

export class UpdateMemberDto {
  @ApiProperty({})
  @IsString()
  @IsOptional()
  fullname: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({ enum: MemberRoles })
  @IsEnum(MemberRoles)
  @IsOptional()
  user_role: string;
}
