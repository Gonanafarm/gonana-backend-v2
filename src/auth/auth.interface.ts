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
  IsOptional,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";
import {UserPublicData} from "../user/user.dto";
import {AccountType, SignupAccountType} from "../common/enums";
import {Transform} from "class-transformer";

export function Trim(validationOptions?: ValidationOptions) {
  return function (object: Record<any, any>, propertyName: string) {
    registerDecorator({
      name: "trim",
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (typeof value === "string") {
            args.object[propertyName] = value.trim();
          }
          return true;
        },
      },
    });
  };
}

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
  @Trim()
  @IsString()
  @MaxLength(255)
  @ApiProperty({})
  @Transform(({value}) => value.trim())
  readonly first_name!: string;

  @IsString()
  @MaxLength(255)
  @ApiProperty({})
  @Transform(({value}) => value.trim())
  @Trim()
  readonly last_name!: string;

  @IsMobilePhone()
  @MaxLength(255)
  @ApiProperty({})
  @Transform(({value}) => value.trim())
  @Trim()
  readonly phone!: string;

  @IsEnum(SignupAccountType)
  @ApiProperty({enum: SignupAccountType})
  @Transform(({value}) => value.trim())
  @Trim()
  readonly account_type!: string;

  @ApiProperty({example: "email@email.com", maxLength: 255})
  @Transform(({value}) => value.trim())
  @Trim()
  @IsEmail()
  readonly email!: string;

  @ApiProperty({example: "password", minLength: 8})
  @Transform(({value}) => value.trim())
  @MinLength(8)
  @Trim()
  readonly password!: string;

  @ApiProperty({})
  @Transform(({value}) => value.trim())
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @Trim()
  readonly country: string;

  @Transform(({value}) => value.trim())
  @IsString()
   @IsOptional()
 // @IsNotEmpty()
  readonly referral_code: string;
}

export class LoginDto {
  @ApiProperty({example: "email@email.com", maxLength: 255})
  @Transform(({value}) => value.trim())
  @IsEmail()
  @Trim()
  readonly email!: string;

  @ApiProperty({example: "password", minLength: 8})
  @Transform(({value}) => value.trim())
  @MinLength(8)
  @Trim()
  readonly password!: string;

  @IsEnum(AccountType)
  @Transform(({value}) => value.trim())
  @ApiProperty({enum: AccountType})
  @Trim()
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
  @Trim()
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
  readonly email!: string;

  @ApiProperty({example: "password", minLength: 8})
  @MinLength(8)
  readonly password!: string;
}
export class UserProfileResponse {
  @ApiProperty({type: UserPublicData})
  user: UserPublicData;
}
