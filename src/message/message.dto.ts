import {IsString, IsNotEmpty, IsOptional, IsBoolean} from "class-validator";

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  recipientId: string;

  @IsString()
  @IsNotEmpty()
  channel: string;

  @IsOptional()
  @IsBoolean()
  isUrl: boolean;
}
