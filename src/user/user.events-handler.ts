import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {UserMailerService} from "./user.mailer.service";
import {UserService} from "./user.service";
import {providers, Wallet} from "ethers";
import axios from "axios";
import { toronetHeaders } from "../common/enums";
@Injectable()
export class UserEventHanders {
  constructor(
    private readonly userMailer: UserMailerService,
    private userService: UserService,
  ) {}
  @OnEvent("account.created")
  async handleAccountCreatedEvent(payload: any) {
    console.log("account created");
    console.log(payload.user);

    const otp = this.userService.generateOtp();
    await this.userService.createOtpModel(payload.user.email, otp);
    this.userMailer.sendOTP(payload.user.email, otp);
    console.log("mail sent");

    const url = "https://mainnet.infura.io/v3/613c483e28cf4d338959ca31e1582b56";
    const provider = new providers.JsonRpcProvider(url);
    const wallet = Wallet.createRandom();
    const privateKey = wallet.privateKey;

    const address = wallet.address;
    const balance = await provider.getBalance(address);

    const data = await this.userService.findByEmail(payload.user.email);
    data.user.privateKey = privateKey;
    data.user.wallet = balance.toString();
    data.user.wallet_address = address;

    const torodata = {
      op: "createkey",
      params: [
        {
          name: "pwd",
          value: `${data.user.email}`,
        },
      ],
    };
    const toronetResponse = await axios.post(
      `${process.env.TORONET_BASE_URL}/keystore`,
      torodata,
      {
        headers: toronetHeaders,
      },
    );
    const fiat_wallet_address = toronetResponse.data.address;
    data.user.fiat_wallet_address = fiat_wallet_address;
    await data.user.save();

    console.log("Wallet Address:", address);
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
  handleAccountLogindEvent(payload: any) {
    // handle and process "OrderCreatedEvent" event
    console.log("on account login event");
    this.userMailer.sendLoginSecurityMail(payload.email);
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
}
