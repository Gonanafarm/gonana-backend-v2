import { Model } from "mongoose";
import { v4 as uuid } from "uuid";
import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import config from "../config";
import { hashPassword } from "../common/auth";
import {
  UserNotFoundException,
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  ActivationTokenInvalidException,
} from "../common/exceptions";

import { UserMailerService } from "./user.mailer.service";
import { paystackActions } from "../common/paystack/paystack.service";
import { AttachAccountDto } from "../organisation/organisation.dto";
import { UserDocument } from "./user.schema";
import { appNotifications } from "../firebase";

@Injectable()
export class UserService {
  constructor(
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
    private readonly userMailer: UserMailerService,
  ) { }







  /**
   * Creates user and sends activation email.
   * @throws duplicate key error when
   */
  async create(email: string, password: string, origin: string): Promise<UserDocument> {
    try {
      const user = await this.userModel.create({
        email: email.toLowerCase(),
        password: await hashPassword(password),
        activationToken: uuid(),
        activationExpires: Date.now() + config.auth.activationExpireInMs,
      });

      this.userMailer.sendActivationMail(
        user.email,
        user.id,
        user.activationToken,
        origin,
      );

      appNotifications.notifyUser("Your account have been created; Please make time to update your profile and upgrade.", user.email, "account.created");

      return user;
    } catch {
      throw EmailAlreadyUsedException();
    }
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw UserNotFoundException();
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument> {
    const user = await this.userModel.findOne(
      { email: email.toLowerCase() },
      "+password",
    );

    if (!user) {
      throw UserNotFoundException();
    }

    return user;
  }

  async activate(userId: string, activationToken: string) {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: userId,
          activationToken,
          isActive: false,
        },
        {
          isActive: true,
          activationToken: undefined,
          activationExpires: undefined,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .where("activationExpires")
      .gt(Date.now())
      .exec();

    if (!user) {
      throw ActivationTokenInvalidException();
    }

    return user;
  }

  async forgottenPassword(email: string, origin: string) {
    const user = await this.userModel.findOneAndUpdate(
      {
        email: email.toLowerCase(),
      },
      {
        passwordResetToken: uuid(),
        passwordResetExpires: Date.now() + config.auth.passwordResetExpireInMs,
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      throw UserNotFoundException();
    }

    this.userMailer.sendForgottenPasswordMail(
      user.email,
      user.passwordResetToken,
      origin,
    );
  }

  async resetPassword(
    email: string,
    passwordResetToken: string,
    password: string,
  ) {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          email: email.toLowerCase(),
          passwordResetToken,
        },
        {
          password: await hashPassword(password),
          passwordResetToken: undefined,
          passwordResetExpires: undefined,
        },
        {
          new: true,
          runValidators: true,
        },
      )
      .where("passwordResetExpires")
      .gt(Date.now())
      .exec();

    if (!user) {
      throw PasswordResetTokenInvalidException();
    }

    this.userMailer.sendResetPasswordMail(user.email);

    return user;
  }

  async attachBankAccount(dto: AttachAccountDto, user_id: string): Promise<any> {
    try {
      let paystackAddSubaccountResponse = await paystackActions.addSubaccount(dto);
      await this.userModel
        .findOneAndUpdate({ _id: user_id }, { paystack_int: paystackAddSubaccountResponse.data });
      return "Attached bank account to profile";
    } catch (err) {
      throw err;
    }
  }

  async enableAccountSubscriptionStatus(account_email: string, plan: string, transactionObj: any) {
    // notify usuer on event success
    try {
      await this.userModel
        .findOneAndUpdate({ email: account_email }, {
          subscription_status: "paid", subscription_transaction: transactionObj,
          subscription_plan: plan
        });

      // sent notification
      appNotifications.notifyUser("Your account's plan has been activated. Enjoy amazing features on more", account_email, "subscription.enabled");
    } catch (err) {
      throw err;
    }
  }

  async disableAccountSubscriptionStatus(account_email: string, transactionObj: any) {
    // notify usuer on event success
    try {
      await this.userModel
        .findOneAndUpdate({ email: account_email }, {
          subscription_status: "failed", subscription_transaction: transactionObj,
        });

      // sent notification
      appNotifications.notifyUser("Your account's subscription have been disabled due to lack of renewal.", account_email, "subscription.closed");
    } catch (err) {
      throw err;
    }
  }

  async setupSubscriptiion(email: string, plan_code: string) {
    try {
      let paystackCreateTransactionResponse = await paystackActions.initSubscriptionTransaction({
        email: email,
        amount: 5000,
        plan: plan_code
      });
      return paystackCreateTransactionResponse
    } catch (err) {
      console.log(err, " Error ")
      throw err;
    }
  }

}
