import { ApiProperty } from '@nestjs/swagger';

export class TransferDto {
  @ApiProperty()
  to: string;

  @ApiProperty()
  amount: string;
}

export class CreateEscrowDto {
  @ApiProperty()
  seller: string;

  @ApiProperty()
  amount: string;
}

export class EscrowActionDto {
  @ApiProperty()
  orderId: string;
}

export class WalletResponseDto {
  @ApiProperty()
  address: string;

  @ApiProperty()
  balance: string;

  @ApiProperty()
  escrowBalance: string;
}
