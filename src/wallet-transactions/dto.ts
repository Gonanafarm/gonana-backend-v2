import {ApiProperty} from "@nestjs/swagger";
import {IsNumber, IsString} from "class-validator";

export class WalletSendFundDto {
  @IsString()
  @ApiProperty()
  from_account_number: string;

  @IsString()
  @ApiProperty()
  receipitent_account_number: string;
  @IsNumber()
  @ApiProperty()
  amount: number;
  @IsString()
  @ApiProperty()
  purpose: string;
}
