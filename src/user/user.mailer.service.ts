import {Injectable} from "@nestjs/common";
import {MailerService} from "@nest-modules/mailer";
import config from "../config";

@Injectable()
export class UserMailerService {
  constructor(private readonly mailerService: MailerService) {}

  sendActivationMail(
    email: string,
    userId: string,
    activationToken: string,
    origin: string,
  ) {
    this.mailerService
      .sendMail({
        to: email,
        subject: "Activate your account",
        template: "activate-account", // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
        context: {
          link: `${origin}/verify/${userId}/${activationToken}`,
        },
      })
      .catch();
  }

  sendForgottenPasswordMail(
    to: string,
    passwordResetToken: string,
    origin: string,
  ) {
    this.mailerService
      .sendMail({
        to,
        subject: "Reset your password",
        template: "reset-password",
        context: {
          resetLink: `${origin}/reset-password/${passwordResetToken}`,
        },
      })
      .catch(console.log);
  }

  sendResetPasswordMail(email: string) {
    this.mailerService
      .sendMail({
        to: email,
        template: "on-password-reset",
        subject: "Your password has been changed",
        context: {
          message: `This is a confirmation that the password for your account ${email} has just been changed.\n`,
        },
      })
      .catch();
  }

  sendLoginSecurityMail(email: string) {}

  sendNotification(email: string, title: string, message: string) {
    this.mailerService
      .sendMail({
        to: email,
        template: "notification",
        subject: title,
        context: {
          message,
        },
      })
      .catch();
  }

   sendOTP(email: string, OTP: string) {
    try {
     this.mailerService.sendMail({
        to: email,
        subject: "Verify your OTP",
        html: `Your OTP is ${OTP}`,
      });
    } catch (error) {
      console.error(`Error sending OTP email to ${email}:`, error);
    }
  }
}
