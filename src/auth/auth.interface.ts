import {
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
  IsNotEmpty,
  IsString,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { UserPublicData } from "../user/user.dto";

// TODO add mixins like EmailField, PasswordField

export class ActivateParams {
  @ApiProperty({ type: String })
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;

  @ApiProperty({ type: String })
  @IsUUID()
  readonly activationToken!: string;
}

export class SignUpDto {
  @ApiProperty({ example: "email@email.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: "password", minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class LoginDto {
  @ApiProperty({ example: "email@email.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ example: "password", minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}

export class AuthenticatedUser {
  @ApiProperty({})
  token: string;
  user: UserPublicData
}

export class ForgottenPasswordDto {
  @ApiProperty({ example: "email@email.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: "email@email.com", maxLength: 255 })
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({ type: String })
  @IsUUID()
  readonly passwordResetToken!: string;

  @ApiProperty({ example: "password", minLength: 8 })
  @MinLength(8)
  readonly password!: string;
}
