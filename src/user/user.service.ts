import {Model} from "mongoose";
import {v4 as uuid} from "uuid";
import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import config from "../config";
import {hashPassword} from "../common/auth";
import {
  UserNotFoundException,
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  ActivationTokenInvalidException,
} from "../common/exceptions";
import {UserMailerService} from "./user.mailer.service";
import {UserDocument} from "./user.schema";
import {GenericService} from "../generic/generic.service";
import {UserModule} from "./user.module";
import {MonifyService} from "../monify/service";

@Injectable()
export class UserService extends GenericService<UserDocument> {
  constructor(
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
    private readonly userMailer: UserMailerService,
    private readonly monifyService: MonifyService,
  ) {
    super(userModel);
  }

  /**
   * Creates user and sends activation email.
   * @throws duplicate key error when
   */
  async createAccount(
    first_name: string,
    last_name: string,
    phone: string,
    email: string,
    password: string,
    origin: string,
    account_type: string,
  ): Promise<UserDocument> {
    try {
      const user = await this.userModel.create({
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone,
        account_type,
        password: await hashPassword(password),
        activationToken: uuid(),
        activationExpires: Date.now() + config.auth.activationExpireInMs,
      });

      // research user account
      this.monifyService.onCreateNewUser(user)

      // this.userMailer.sendActivationMail(
      //   user.email,
      //   user.id,
      //   user.activationToken,
      //   origin,
      // );

      return user;
    } catch (e) {
      console.log(e);
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
      {email: email.toLowerCase()},
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
        // set reset token
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
}
