/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {
  WalletTransaction,
  WalletTransactionDocument,
} from "./wallet-transaction.schema";
import {GenericService} from "../generic/generic.service";
import {WalletService} from "../wallet/wallet.service";
import {MonifyTransactionEventPayload} from "../public/monify.event.interface";
import {WalletSendFundDto} from "./dto";
@Injectable()
export class WalletTransactionService extends GenericService<WalletTransactionDocument> {
  constructor(
    @InjectModel(WalletTransaction.name)
    private model: Model<WalletTransactionDocument>,
    private walletService: WalletService,
  ) {
    super(model);
  }

  async onBankAccountFundedExternally(payload: MonifyTransactionEventPayload) {
    //@ts-ignore
    let balance = payload.eventData.totalPayable as number;
    let accountNumber =
      payload.eventData.destinationAccountInformation.accountNumber;
    await this.dataModel.create({
      status: "completed",
      source: "external",
      account_number: accountNumber,
      amount: payload.eventData.totalPayable,
      type: "funding",
      from:
        payload.eventData.paymentSourceInformation[0] ??
        payload.eventData.paymentSourceInformation,
      to: payload.eventData.destinationAccountInformation,
    });

    await this.walletService.updateBalance(accountNumber, balance);
  }

  async onWalletTransferInternally(
    publisher_id: string,
    payload: WalletSendFundDto,
  ) {
    let wallet = await this.walletService.dataModel.findOne({
      account_number: payload.from_account_number,
      user_id: publisher_id,
    });

    if (wallet == undefined) {
      throw new NotFoundException({message: "wallet not found"});
    }

    if (wallet != undefined && !(wallet.balance >= payload.amount)) {
      throw new BadRequestException({message: "Insufficient balance"});
    }

    //@ts-ignore
    let balance = payload.amount;
    let accountNumber = payload.receipitent_account_number;

    // transfer from wallet
    await this.dataModel.create({
      status: "completed",
      source: "internally",
      account_number: accountNumber,
      type: "credit",
      amount: balance,
      from: {accountNumber: payload.from_account_number},
      to: {accountNumber: payload.receipitent_account_number},
    });

    await this.dataModel.create({
      status: "completed",
      source: "internally",
      account_number: payload.from_account_number,
      type: "debit",
      amount: balance,
      from: {accountNumber: payload.from_account_number},
      to: {accountNumber: payload.receipitent_account_number},
    });

    // debit account
    await this.walletService.updateBalance(
      payload.from_account_number,
      -balance,
    );

    //credit receipient
    await this.walletService.updateBalance(
      payload.receipitent_account_number,
      balance,
    );

    return "Transaction successful";
  }
}
