import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import {UserMailerService} from "./user.mailer.service";
import {UserService} from "./user.service";

@Injectable()
export class UserEventHanders {
  constructor(
    private readonly userMailer: UserMailerService,
    private userService: UserService,
  ) {}
  @OnEvent("account.created")
  async handleAccountCreatedEvent(payload: any) {
    console.log("account created");
    const otp = this.userService.generateOtp();
    //await this.userService.virtualAccount(payload.user.first_name, payload.user.bvn)
    await this.userService.createOtpModel(payload.user.email, otp);
    this.userMailer.sendOTP(payload.user.email, otp);
    console.log("mail sent");
    await this.userService.virtualAccount(payload.user.first_name, payload.user.bvn)
    console.log("Virtual Account Created");
    
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
    let user = await this.userService.getItem(driver_id);

    this.userMailer.sendNotification(
      user.email,
      "Verification update",
      "This is to notify you that documents you submitted did not pass the verification stage, kindly update proceed to the verification page and request a new verification.",
    );
  }
}
