import {
  IsEmail,
  MinLength,
  MaxLength,
  IsUUID,
  IsNotEmpty,
  IsString,
  IsPhoneNumber,
  IsEnum,
  IsMobilePhone,
  Max,
  Length,
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {UserPublicData} from "../user/user.dto";
import {AccountType, SignupAccountType} from "../common/enums";

export class ActivateParams {
  @ApiProperty({type: String})
  @IsNotEmpty()
  @IsString()
  readonly userId!: string;

  @ApiProperty({type: String})
  @IsUUID()
  readonly activationToken!: string;
}

export class SignUpDto {
  @IsString()
  @MaxLength(255)
  @ApiProperty({})
  readonly first_name!: string;

  @IsString()
  @MaxLength(255)
  @ApiProperty({})
  readonly last_name!: string;

  @IsMobilePhone()
  @MaxLength(255)
  @ApiProperty({})
  readonly phone!: string;

  @IsEnum(SignupAccountType)
  @ApiProperty({enum: SignupAccountType})
  readonly account_type!: string;

  @ApiProperty({example: "email@email.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({example: "password", minLength: 8})
  @MinLength(8)
  readonly password!: string;

}

export class LoginDto {
  @ApiProperty({example: "email@email.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({example: "password", minLength: 8})
  @MinLength(8)
  readonly password!: string;

  @IsEnum(AccountType)
  @ApiProperty({enum: AccountType})
  readonly account_type!: string;
}

export class AuthenticatedUser {
  @ApiProperty({})
  token: string;
  user: UserPublicData;
}

export class ForgottenPasswordDto {
  @ApiProperty({example: "email@email.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;
}

export class DeleteUserDto {
  @IsEmail()
  readonly email!: string;

  @Length(4, 4)
  readonly passcode!: string;
}

export class OtpDto {
  @Length(4, 4)
  readonly otp!: string;
}

export class ResetPasswordDto {
  @ApiProperty({example: "email@email.com", maxLength: 255})
  @IsEmail()
  @MaxLength(255)
  readonly email!: string;

  @ApiProperty({example: "password", minLength: 8})
  @MinLength(8)
  readonly password!: string;
}
export class UserProfileResponse {
  @ApiProperty({type: UserPublicData})
  user: UserPublicData;
}
