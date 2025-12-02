import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ethers } from 'ethers';
import * as crypto from 'crypto';
import { Wallet, WalletDocument } from './wallet.schema';
import { TransferDto, CreateEscrowDto, WalletResponseDto } from './wallet.dto';

const ESCROW_ABI = [
  "function createOrder(address _seller) external payable returns (uint256)",
  "function markShipped(uint256 _orderId) external",
  "function confirmDelivery(uint256 _orderId) external",
  "function autoComplete(uint256 _orderId) external",
  "function refundBuyer(uint256 _orderId) external",
  "function raiseDispute(uint256 _orderId) external",
  "function getOrder(uint256 _orderId) external view returns (tuple(address buyer, address seller, uint256 amount, uint8 status, uint256 createdAt, uint256 shippedAt))",
  "event OrderCreated(uint256 indexed orderId, address indexed buyer, address indexed seller, uint256 amount)"
];

@Injectable()
export class WalletService {
  private provider: ethers.providers.JsonRpcProvider;
  private readonly ENCRYPTION_KEY: string;
  private readonly CONTRACT_ADDRESS: string;
  private readonly NETWORK: string;

  constructor(
    @InjectModel(Wallet.name) private walletModel: Model<WalletDocument>,
  ) {
    // Use testnet by default, can be configured via env
    this.NETWORK = process.env.BSC_NETWORK || 'testnet';
    this.CONTRACT_ADDRESS = process.env.ESCROW_CONTRACT_ADDRESS || '';
    
    const rpcUrl = this.NETWORK === 'mainnet'
      ? 'https://bsc-dataseed.binance.org/'
      : 'https://data-seed-prebsc-1-s1.binance.org:8545/';
    
    this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    
    // Use 32-byte key from env or generate one (MUST be stored securely in production)
    this.ENCRYPTION_KEY = process.env.WALLET_ENCRYPTION_KEY || 
      crypto.randomBytes(32).toString('hex');
  }

  // Encrypt private key before storing
  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv
    );
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt private key when needed
  private decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = parts[1];
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.ENCRYPTION_KEY, 'hex'),
      iv
    );
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Create or get existing wallet
  async getOrCreateWallet(userId: string): Promise<WalletResponseDto> {
    let wallet = await this.walletModel.findOne({ userId });

    if (!wallet) {
      // Generate new wallet
      const ethWallet = ethers.Wallet.createRandom();
      
      wallet = await this.walletModel.create({
        userId,
        address: ethWallet.address,
        encryptedPrivateKey: this.encrypt(ethWallet.privateKey),
        balance: '0',
        escrowBalance: '0',
      });
    }

    // Fetch live balance
    const balance = await this.getBalance(wallet.address);

    return {
      address: wallet.address,
      balance,
      escrowBalance: wallet.escrowBalance,
    };
  }

  // Get wallet by user ID
  async getWalletByUserId(userId: string): Promise<WalletDocument> {
    const wallet = await this.walletModel.findOne({ userId });
    if (!wallet) {
      throw new NotFoundException('Wallet not found');
    }
    return wallet;
  }

  // Get balance from blockchain
  async getBalance(address: string): Promise<string> {
    const balance = await this.provider.getBalance(address);
    return ethers.utils.formatEther(balance);
  }

  // Get signer from wallet
  private async getSigner(userId: string): Promise<ethers.Wallet> {
    const wallet = await this.getWalletByUserId(userId);
    const privateKey = this.decrypt(wallet.encryptedPrivateKey);
    return new ethers.Wallet(privateKey, this.provider);
  }

  // Transfer BNB
  async transfer(userId: string, transferDto: TransferDto): Promise<any> {
    if (!ethers.utils.isAddress(transferDto.to)) {
      throw new BadRequestException('Invalid recipient address');
    }

    const signer = await this.getSigner(userId);
    const amount = ethers.utils.parseEther(transferDto.amount);

    // Check balance
    const balance = await signer.getBalance();
    if (balance.lt(amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const tx = await signer.sendTransaction({
      to: transferDto.to,
      value: amount,
    });

    await tx.wait();

    return {
      txHash: tx.hash,
      from: signer.address,
      to: transferDto.to,
      amount: transferDto.amount,
    };
  }

  // Create escrow order
  async createEscrowOrder(userId: string, dto: CreateEscrowDto): Promise<any> {
    if (!this.CONTRACT_ADDRESS) {
      throw new BadRequestException('Escrow contract not configured');
    }

    if (!ethers.utils.isAddress(dto.seller)) {
      throw new BadRequestException('Invalid seller address');
    }

    const signer = await this.getSigner(userId);
    const contract = new ethers.Contract(this.CONTRACT_ADDRESS, ESCROW_ABI, signer);
    const amount = ethers.utils.parseEther(dto.amount);

    // Check balance
    const balance = await signer.getBalance();
    if (balance.lt(amount)) {
      throw new BadRequestException('Insufficient balance');
    }

    const tx = await contract.createOrder(dto.seller, { value: amount });
    const receipt = await tx.wait();

    // Parse event to get orderId
    const event = receipt.events?.find((e: any) => e.event === 'OrderCreated');
    const orderId = event?.args?.orderId?.toString();

    return {
      txHash: tx.hash,
      orderId,
      buyer: signer.address,
      seller: dto.seller,
      amount: dto.amount,
    };
  }

  // Mark order as shipped (seller)
  async markShipped(userId: string, orderId: string): Promise<any> {
    const signer = await this.getSigner(userId);
    const contract = new ethers.Contract(this.CONTRACT_ADDRESS, ESCROW_ABI, signer);

    const tx = await contract.markShipped(orderId);
    await tx.wait();

    return {
      txHash: tx.hash,
      orderId,
      status: 'shipped',
    };
  }

  // Confirm delivery (buyer)
  async confirmDelivery(userId: string, orderId: string): Promise<any> {
    const signer = await this.getSigner(userId);
    const contract = new ethers.Contract(this.CONTRACT_ADDRESS, ESCROW_ABI, signer);

    const tx = await contract.confirmDelivery(orderId);
    await tx.wait();

    return {
      txHash: tx.hash,
      orderId,
      status: 'completed',
    };
  }

  // Refund buyer (seller)
  async refundBuyer(userId: string, orderId: string): Promise<any> {
    const signer = await this.getSigner(userId);
    const contract = new ethers.Contract(this.CONTRACT_ADDRESS, ESCROW_ABI, signer);

    const tx = await contract.refundBuyer(orderId);
    await tx.wait();

    return {
      txHash: tx.hash,
      orderId,
      status: 'refunded',
    };
  }

  // Get escrow order details
  async getEscrowOrder(orderId: string): Promise<any> {
    if (!this.CONTRACT_ADDRESS) {
      throw new BadRequestException('Escrow contract not configured');
    }

    const contract = new ethers.Contract(this.CONTRACT_ADDRESS, ESCROW_ABI, this.provider);
    const order = await contract.getOrder(orderId);

    const statuses = ['PENDING', 'SHIPPED', 'COMPLETED', 'REFUNDED', 'DISPUTED'];

    return {
      orderId,
      buyer: order.buyer,
      seller: order.seller,
      amount: ethers.utils.formatEther(order.amount),
      status: statuses[order.status],
      createdAt: new Date(order.createdAt.toNumber() * 1000),
      shippedAt: order.shippedAt.toNumber() > 0 
        ? new Date(order.shippedAt.toNumber() * 1000) 
        : null,
    };
  }
}