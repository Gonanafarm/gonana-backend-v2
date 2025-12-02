import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WalletService } from './wallet.service';
import { TransferDto, CreateEscrowDto, EscrowActionDto, WalletResponseDto } from './wallet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Wallet')
@ApiBearerAuth()
@Controller('api/wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  @ApiOperation({ summary: 'Get or create user wallet' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved/created', type: WalletResponseDto })
  async getOrCreateWallet(@Request() req): Promise<WalletResponseDto> {
    return this.walletService.getOrCreateWallet(req.user.id);
  }

  @Get('balance')
  @ApiOperation({ summary: 'Get wallet balance' })
  @ApiResponse({ status: 200, description: 'Balance retrieved' })
  async getBalance(@Request() req): Promise<{ balance: string }> {
    const wallet = await this.walletService.getWalletByUserId(req.user.id);
    const balance = await this.walletService.getBalance(wallet.address);
    return { balance };
  }

  @Post('transfer')
  @ApiOperation({ summary: 'Transfer BNB to another address' })
  @ApiResponse({ status: 200, description: 'Transfer successful' })
  async transfer(@Request() req, @Body() transferDto: TransferDto) {
    return this.walletService.transfer(req.user.id, transferDto);
  }

  @Post('escrow/create')
  @ApiOperation({ summary: 'Create escrow order' })
  @ApiResponse({ status: 200, description: 'Escrow order created' })
  async createEscrow(@Request() req, @Body() dto: CreateEscrowDto) {
    return this.walletService.createEscrowOrder(req.user.id, dto);
  }

  @Post('escrow/mark-shipped')
  @ApiOperation({ summary: 'Mark order as shipped (seller only)' })
  @ApiResponse({ status: 200, description: 'Order marked as shipped' })
  async markShipped(@Request() req, @Body() dto: EscrowActionDto) {
    return this.walletService.markShipped(req.user.id, dto.orderId);
  }

  @Post('escrow/confirm-delivery')
  @ApiOperation({ summary: 'Confirm delivery (buyer only)' })
  @ApiResponse({ status: 200, description: 'Delivery confirmed' })
  async confirmDelivery(@Request() req, @Body() dto: EscrowActionDto) {
    return this.walletService.confirmDelivery(req.user.id, dto.orderId);
  }

  @Post('escrow/refund')
  @ApiOperation({ summary: 'Refund buyer (seller only)' })
  @ApiResponse({ status: 200, description: 'Buyer refunded' })
  async refundBuyer(@Request() req, @Body() dto: EscrowActionDto) {
    return this.walletService.refundBuyer(req.user.id, dto.orderId);
  }

  @Get('escrow/:orderId')
  @ApiOperation({ summary: 'Get escrow order details' })
  @ApiResponse({ status: 200, description: 'Order details retrieved' })
  async getEscrowOrder(@Request() req) {
    return this.walletService.getEscrowOrder(req.params.orderId);
  }
}