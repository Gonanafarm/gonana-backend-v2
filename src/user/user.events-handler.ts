import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {UserMailerService} from "./user.mailer.service";
import {UserService} from "./user.service";
import {providers, Wallet} from "ethers";
import axios from "axios";
import {toronetHeaders} from "../common/enums";
import {ConcordiumService} from "./concordium.service";
import {UserDocument} from "./user.schema";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Kyc} from "../kyc/kyc.schema";
@Injectable()
export class UserEventHanders {
  constructor(
    private readonly userMailer: UserMailerService,
    private userService: UserService,
    private ccdService: ConcordiumService,
    @InjectModel("Kyc") private readonly kycModel: Model<Kyc>,
  ) {}
  @OnEvent("account.created")
  async handleAccountCreatedEvent(payload: any) {
    console.log("account created");
    console.log(payload.user);

    const otp = this.userService.generateOtp();
    await this.userService.createOtpModel(payload.user.email, otp);
    this.userMailer.sendOTP(payload.user.email, otp);
    console.log("mail sent");

    const data = await this.userService.findByEmail(payload.user.email);
    const wallet = await this.ccdService.getOrCreateConcordiumKeyPairs(
      data.user.id,
    );
    const url = "https://mainnet.infura.io/v3/613c483e28cf4d338959ca31e1582b56";
    const provider = new providers.JsonRpcProvider(url);
    const arbitrumWallet = Wallet.createRandom();
    const arbitrumPrivateKey = arbitrumWallet.privateKey;

    const arbitrumAddress = arbitrumWallet.address;
    const arbitrumWalletBalance = await provider.getBalance(arbitrumAddress);

    data.user.arbitrum_wallet_address = arbitrumAddress;
    data.user.arbitrumPrivateKey = arbitrumPrivateKey;
    data.user.arbitrum_wallet = arbitrumWalletBalance.toString();

    const address = wallet.publicKey;
    const balance = await this.ccdService.ccdBalanceOf(data.user.id);
    console.log(balance);
    const privateKey = wallet.privateKey;

    data.user.ccdPrivateKey = privateKey;
    data.user.ccd_wallet = balance.toString();
    data.user.ccd_wallet_address = address;

    // const torodata = {
    //   op: "createkey",
    //   params: [
    //     {
    //       name: "pwd",
    //       value: `${data.user.email}`,
    //     },
    //   ],
    // };
    // const toronetResponse = await axios.post(
    //   `${process.env.TORONET_BASE_URL}/keystore`,
    //   torodata,
    //   {
    //     headers: toronetHeaders,
    //   },
    // );
    // const fiat_wallet_address = toronetResponse.data.address;
    // data.user.fiat_wallet_address = fiat_wallet_address;
    data.user.referral_code =
      await this.userService.generateUniqueReferralCode();
    await data.user.save();

    console.log("Balance:", balance.toString());
  }

  @OnEvent("account.activation.updated")
  handleAccountActivationUpdated(payload: any) {
    this.userMailer.sendActivationMail(
      payload.user.email,
      payload.user.id,
      payload.user.activationToken,
      payload.origin,
    );
  }

  @OnEvent("account.updated")
  handleAccountUpdatedEvent() {
    // handle and process "OrderCreatedEvent" event
    console.log("on account update");
  }

  @OnEvent("account.login")
  async handleAccountLogindEvent(user: UserDocument) {
    // handle and process "OrderCreatedEvent" event
  }

  @OnEvent("account.activated")
  handleAccountActivated(email: string) {
    console.log("on account login event");
    console.log(email);
  }

  @OnEvent("account.password.updated")
  handleAccountPasswordUpdatedEvent(payload: string) {
    // handle and process "OrderCreatedEvent" event
    console.log("on account password update");
    this.userMailer.sendResetPasswordMail(payload);
  }

  @OnEvent("forgot.password")
  handleAccountPasswordUpdateStartEvent(payload: any) {
    // handle and process "OrderCreatedEvent" event
    console.log("account password update trigger");
    console.log(payload);

    this.userMailer.sendOTP(payload.email, payload.otp);
  }

  @OnEvent("driver.disapproved")
  async handleDriverDisApproved(driver_id: string) {
    const user = await this.userService.getItem(driver_id);

    this.userMailer.sendNotification(
      user.email,
      "Verification update",
      "This is to notify you that documents you submitted did not pass the verification stage, kindly update proceed to the verification page and request a new verification.",
    );
  }
  @OnEvent("Wallet Upgrade")
  async createKycDocument(payload: any) {
    try {
      console.log("Wallet Upgrade Event Triggered with payload:", payload);

      if (!payload || !payload.bvn || !payload.userId) {
        console.error("Invalid payload received:", payload);
        return;
      }

      const kycExists = await this.kycModel.findOne({
        bvn: payload.bvn,
        userId: payload.userId,
      });

      if (kycExists) {
        console.log("Updating existing KYC document:", kycExists);
        await this.kycModel.updateOne(
          {bvn: payload.bvn, userId: payload.userId},
          {$set: payload},
        );
      } else {
        console.log("Creating new KYC document");
        const newKyc = await this.kycModel.create(payload);
      }

      console.log("KYC document processed successfully");
    } catch (error) {
      console.error("Error processing KYC document:", error);
      // Log error but do not throw to prevent stopping server operations
    }
  }
}
