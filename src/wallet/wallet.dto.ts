import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class WalletResponseDto {
  @ApiProperty()
  address: string;

  @ApiProperty()
  balance: string;

  @ApiProperty()
  escrowBalance: string;
}

export class TransferDto {
  @ApiProperty({ description: 'Recipient wallet address' })
  @IsString()
  @IsNotEmpty()
  to: string;

  @ApiProperty({ description: 'Amount in BNB (e.g., "0.01")' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class CreateEscrowDto {
  @ApiProperty({ description: 'Seller wallet address' })
  @IsString()
  @IsNotEmpty()
  seller: string;

  @ApiProperty({ description: 'Amount in BNB' })
  @IsString()
  @IsNotEmpty()
  amount: string;
}

export class EscrowActionDto {
  @ApiProperty({ description: 'Escrow order ID' })
  @IsString()
  @IsNotEmpty()
  orderId: string;
}