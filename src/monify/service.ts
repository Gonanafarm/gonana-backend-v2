/* eslint-disable no-useless-catch */
import {Controller, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import axios from "axios";
import {User} from "../user/user.schema";
import config from "../config";
import {ReserveAccountPayload} from "./interface";
import {ReservedAccountService} from "../reserved-account/service";
import {WalletService} from "../wallet/wallet.service";

@Injectable()
export class MonifyService {
  constructor(
    private reserveBankService: ReservedAccountService,
    private walletService: WalletService,
  ) {}
  async onCreateNewUser(payload: User) {
    const fullname = `${payload.first_name} ${payload.last_name}`;
    let newAccount = await this.reserveAccount({
      accountName: `${fullname}`,
      //@ts-ignore
      accountReference: `${payload.first_name}${payload.last_name}${payload._id}`,
      contractCode: "4197962802",
      currencyCode: "NGN",
      customerEmail: payload.email,
      customerName: fullname,
      incomeSplitConfig: [],
    });

    console.log(newAccount);

    // upsert bank account for newly created account
    this.walletService.dataModel
      .updateOne(
        {
          //@ts-ignore
          user_id: payload._id,
        },
        {...newAccount},
        {upsert: true},
      )
      .exec();

    // upsert wallet for newly created account
    this.walletService.dataModel
      .updateOne(
        {
          //@ts-ignore
          user_id: payload._id,
        },
        {
          //@ts-ignore
          user_id: payload._id,
          account_number: newAccount.accountNumber,
          balance: 0,
        },
        {upsert: true},
      )
      .exec();
  }

  async reserveAccount(payload: ReserveAccountPayload) {
    const access_token = await this.getBearereToken();

    try {
      let response = await axios({
        method: "post",
        url: "https://private-4e230-monnify.apiary-mock.com/api/v1/bank-transfer/reserved-accounts",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        data: payload,
      });

      if (response.data.responseMessage == "success") {
        return response.data.responseBody;
      } else {
        return {};
      }
    } catch (err) {
      console.log(err);
    }
  }

  async getBearereToken() {
    try {
      let response = await axios({
        method: "post",
        url: "https://private-4e230-monnify.apiary-mock.com/api/v1/auth/login/",
        headers: {
          Authorization: `Bearer XWGTCPLSR3U7G3AAAV1TC0TP2PZ04ZEP`,
          "Content-Type": "application/json",
        },
      });
      return response.data.responseBody.accessToken;
    } catch (err) {
      console.log(err);
    }
  }

  async getReservedAccountTransactions() {
    try {
    } catch (err) {
      console.log(err);
    }
  }
}
