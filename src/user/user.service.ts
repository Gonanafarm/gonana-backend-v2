import {Model} from "mongoose";
import * as mongoose from "mongoose";
import {v4 as uuid} from "uuid";
import {Injectable} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import config from "../config";
import {comparePassword, hashPassword} from "../common/auth";
import {
  UserNotFoundException,
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  ActivationTokenInvalidException,
  DeletionException,
} from "../common/exceptions";
import {UserMailerService} from "./user.mailer.service";
import {UserDocument} from "./user.schema";
import {EventEmitter2} from "@nestjs/event-emitter";
import {GenericService} from "../generic/generic.service";
import {OtpDocument} from "./otp.schema";
import {CloudinaryService} from "../post/cloudinary.service";

@Injectable()
export class UserService extends GenericService<UserDocument> {
  constructor(
    //@ts-ignore
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
    @InjectModel("Otp") private readonly otpModel: Model<OtpDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userMailer: UserMailerService,
    private eventEmitter: EventEmitter2,
  ) {
    super(userModel);
  }

  async createAccount(
    first_name: string,
    last_name: string,
    phone: string,
    email: string,
    password: string,
    origin: string,
    account_type: string,
    //imageFile: Express.Multer.File,
  ): Promise<UserDocument> {
    try {
      // const image = await this.cloudinaryService.uploadImage(imageFile);
      const user = await this.userModel.create({
        email: email.toLowerCase(),
        first_name,
        last_name,
        phone,
        account_type,
        password: await hashPassword(password),
        activationToken: uuid(),
        activationExpires: Date.now() + config.auth.activationExpireInMs,
        //   image,
      });

      // on account created
      this.eventEmitter.emit("account.created", {
        user,
        origin,
      });

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
  async deleteUser(
    email: string,
  ): Promise<{success: boolean; message: string}> {
    const deletedUser = await this.userModel.deleteOne({email: email});
    if (!deletedUser) {
      throw DeletionException();
    }
    return {
      success: true,
      message: "User deleted successfully",
    };
  }

  async resendActivation(id: string, origin: any): Promise<any> {
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          activationToken: uuid(),
          activationExpires: Date.now() + config.auth.activationExpireInMs,
        },
        {new: true},
      )
      .exec();

    if (!user) {
      throw UserNotFoundException();
    }

    this.eventEmitter.emit("account.activation.updated", {
      user,
      origin,
    });
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
          // email_activated: false,
        },
        {
          isActive: true,
          email_activated: true,
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

    // trigger account activated
    this.eventEmitter.emit("account.activated", user.email);

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

    // trigger passwor update
    this.eventEmitter.emit("account.password.update.trigger", {
      user,
      origin,
    });
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

    // emit password update emit event
    this.eventEmitter.emit("account.password.updated", user.email);

    return user;
  }
  generateOtp(): string {
    const min = 0;
    const max = 9999;

    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    const otp = randomNumber.toString().padStart(4, "0");
    this.eventEmitter.emit("otp.generated", otp);
    return otp;
  }

  async createOtpModel(email: string, otp: string): Promise<OtpDocument> {
    try {
      const newOtp = await this.otpModel.create({email, otp});
      return newOtp;
    } catch (e: unknown) {
      console.error(e);
      throw new Error("error creating model");
    }
  }

  async verifyOTP(reqOTP: string): Promise<boolean> {
    try {
      const otpModel = await this.otpModel.findOne({otp: reqOTP});

      if (otpModel) {
        await this.userModel.updateOne(
          {email: otpModel.email},
          {$set: {email_activated: true}},
        );
        console.log("success");
        return true;
      } else {
        console.log("fail");
        return false;
      }
    } catch (error) {
      console.error("An error occurred:", error);
      throw new Error("Error while verifying OTP");
    }
  }

  async updateImage(email: string, file: Express.Multer.File) {
    try {
      const image = await this.cloudinaryService.uploadImage(file);
      const user = await this.userModel.findOne({email: email});
      if (user) {
        await this.userModel.updateOne(
          {email: user.email},
          {$set: {profile_photo: image.secure_url}},
        );
        console.log("success");
        return true;
      }
    } catch (e) {
      console.error(e);
      throw new Error("Error while updating image");
    }
  }

  async updateUserDetails(id: string, details: any) {
    const updatedUser = await this.updateItem(id, details);
    return updatedUser;
  }
  async updatePasscode(id: string, passcode: string) {
    const details = await hashPassword(passcode);
    const user = await this.userModel.findById(id);
    if (user) {
      await this.userModel.updateOne(
        {email: user.email},
        {$set: {passcode: details}},
      );
      console.log("success");
      return true;
    } else return false;
  }

  async verifyPasscode(id: string, passcode: string) {
    const user = await this.userModel.findById(id);
    //@ts-ignore
    const verify = comparePassword(passcode, user.passcode);
    if (verify) return true;
    else return false;
  }
}
