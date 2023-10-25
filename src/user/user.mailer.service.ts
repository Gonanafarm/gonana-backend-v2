import {Injectable} from "@nestjs/common";
import {MailerService} from "@nest-modules/mailer";
import {User} from "./user.schema";
import {Post} from "../post/post.schema";

export const convertArrayToString = (array:Array<any>) => {
  if (Array.isArray(array)) {
    if (array.length === 1) {
      return array[0];
    } else {
      return array.join(', ');
    }
  } else {
    return "Input is not an array.";
  }
};

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
  sendBvnVerificationFailedMail(email: string, text: string) {
    try {
      this.mailerService.sendMail({
        to: email,
        subject: "BVN VERIFICATION FAILED",
        html: text,
      });
    } catch (error: any) {
      console.log(error);
    }
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
        subject: "OTP Verification",
        html: `Your OTP is ${OTP}. It expires in 10 Minutes`,
      });
    } catch (error) {
      console.error(`Error sending OTP email to ${email}:`, error);
    }
  }

  async transactionVerification(
    email: string,
    eventType: string,
    transactionAmount: number,
  ) {
    try {
      const sendMailOptions = {
        to: email,
        subject: eventType,
        html: `Your credit transaction with amount ${transactionAmount} is pending`,
      };

      // Use async/await to send the email
      const sentMessageInfo = await this.mailerService.sendMail(
        sendMailOptions,
      );

      return sentMessageInfo;
    } catch (error) {
      console.error(error);
      return undefined; // Or handle the error as needed
    }
  }
  transactionSucess(email: string, transactionAmount: number) {
    try {
      this.mailerService.sendMail({
        to: email,
        subject: "TRANSACTION SUCCESS",
        html: `Your credit transaction with amount ${transactionAmount} is successfull`,
      });
      console.log("Transaction Successful");
    } catch (error) {
      console.error(error);
    }
  }
  orderSuccessMail(email: string, url: string) {
    try {
      this.mailerService.sendMail({
        to: email,
        subject: "ORDER PLACED SUCCESSFULLY ",
        html: `Your tracking url is ${url}`,
      });
      console.log("tracking url mail sent");
    } catch (error) {
      console.log(error);
    }
  }
  selfShipmentMail(farmerEmail: string, product: Post, user: User, quantity:number) {
    try {
      const productImages = product.images.map((imageUrl, index) => `
        <img src="${imageUrl}" alt="Product Image ${index + 1}" style="max-width: 100%;">
      `).join('<br>');
  
      this.mailerService.sendMail({
        to: farmerEmail,
        subject: "YOUR PRODUCTS HAVE BEEN ORDERED",
        html: `
        You are getting this mail because you opted to ship this product yourself<br>
        Product details: <br>
          Title: ${product.title}<br>
          Quantity: ${quantity}<br>
          Price: ${product.amount}<br>
          Images: 
          <br>
          ${productImages}
          <br>Customers Details:<br>
          Name: ${user.first_name} ${user.last_name}<br>
          Number: ${user.phone}<br>
          Address: ${user.address[0].address}
        `,
      });
      console.log("Shipment mail sent");
    } catch (error) {
      console.log(error);
    }
  }
  
  
  
  
}
