import {Model} from "mongoose";
import * as mongoose from "mongoose";
import {v4 as uuid} from "uuid";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import config from "../config";
import {comparePassword, hashPassword} from "../common/auth";
import {
  UserNotFoundException,
  EmailAlreadyUsedException,
  PasswordResetTokenInvalidException,
  ActivationTokenInvalidException,
  DeletionException,
  InvalidPasscodeException,
} from "../common/exceptions";
import {UserMailerService} from "./user.mailer.service";
import {UserDocument} from "./user.schema";
import {EventEmitter2} from "@nestjs/event-emitter";
import {GenericService} from "../generic/generic.service";
import {OtpDocument} from "./otp.schema";
import {CloudinaryService} from "../post/cloudinary.service";
import {HttpService} from "@nestjs/axios";
import {catchError, firstValueFrom} from "rxjs";
import {Request, Response} from "express";
import axios from "axios";

@Injectable()
export class UserService extends GenericService<UserDocument> {
  constructor(
    //@ts-ignore
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
    @InjectModel("Otp") private readonly otpModel: Model<OtpDocument>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userMailer: UserMailerService,
    private eventEmitter: EventEmitter2,
    private httpService: HttpService,
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
    passcode: string,
  ): Promise<{success: boolean; message: string}> {
    const verifyPasscode = await this.verifyPasscode(email, passcode);

    if (!verifyPasscode) {
      return {success: false, message: "Passcode mismatch"};
    }
    const deletedUser = await this.userModel.deleteOne({email: email});
    if (!deletedUser) {
      throw DeletionException();
    }
    const deleteOtp = await this.otpModel.deleteOne({email: email});
    if (!deleteOtp) {
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

  async verifyOTP(reqOTP: string) {
    try {
      const otpModel = await this.otpModel.findOne({otp: reqOTP});

      if (!otpModel) {
        throw new NotFoundException("Otp Invalid");
      }
      await this.userModel.updateOne(
        {email: otpModel.email},
        {$set: {email_activated: true}},
      );

      return {
        success: true,
        message: "Email Verified",
      };
    } catch (error) {
      console.error("An error occurred:", error);
      throw new Error("Error while verifying OTP");
    }
  }

  async resendOtp(email: string) {
    try {
      this.eventEmitter.emit("resendOtp");
      const otpExists = await this.otpModel.findOne({email: email});
      if (!otpExists) {
        const otp = this.generateOtp();
        await this.otpModel.create({otp: otp, email: email});
        this.userMailer.sendOTP(email, otp);
        return {success: true, message: "otp mail sent"};
      }
      await this.otpModel.deleteOne({email: email});
      const otp = this.generateOtp();
      await this.otpModel.create({otp: otp, email: email});
      this.userMailer.sendOTP(email, otp);
      return {success: true, message: "otp mail sent"};
    } catch (error) {
      console.error(error);
      throw new BadRequestException(
        "Email Not provided or something. If you're seeing this you really fucked up",
      );
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
      }
    } catch (e) {
      console.error(e);
      throw new Error("Error while updating image");
    }
  }

  async updateUserDetails(id: string, details: any) {
    try {
      const updatedUser = await this.updateItem(id, details);
      return updatedUser;
    } catch (error: any) {
      console.log(error);
      throw new Error(`${error.message}`);
    }
  }
  async updatePasscode(id: string, passcode: string) {
    if (passcode.length !== 4) {
      throw new BadRequestException("Passcode must be 4 characters");
    }
    const details = await hashPassword(passcode);
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException("User not found, login and try again");
    }
    await this.userModel.updateOne(
      {email: user.email},
      {$set: {passcode: details}},
    );
    return {
      success: true,
      message: "Passcode created",
    };
  }

  async verifyPasscode(email: string, passcode: string) {
    if (passcode.length !== 4) {
      throw new BadRequestException("Passcode must be 4 characters");
    }
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`User not found, login and try again`);
    }
    const verify = comparePassword(passcode, user.passcode);

    if (!verify) {
      throw new BadRequestException(`Passcode Invalid`);
    }
    return {
      success: true,
      message: "Passcode verified",
    };
  }

  async getUserData(id: string) {
    const user = await this.userModel.findById(id);
    return user?.getPublicData();
  }

  async virtualAccount(name: string, bvn: string) {
    const base_url = process.env.MINTYN_BASE_URL;
    const id = process.env.MERCHANT_ID;
    const secret = process.env.MINTYN_SECRET;
    const tokenUrl = `${base_url}/api/v1/authorization/generate-token/${id}`;
    const tokenHeaders = {
      "secret-key": process.env.MINTYN_SECRET,
    };

    try {
      const response = await axios.get(tokenUrl, {headers: tokenHeaders});

      const token = response.data.data.token;

      const accountHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const data = {
        customerFirstName: name,
        customerBVN: bvn,
      };
      const accountUrl = `${base_url}/api/v1/merchant/virtual-account/reserved-account`;
      const createAccount = await axios.post(accountUrl, data, {
        headers: accountHeaders,
      });

      return createAccount.data;
    } catch (error: any) {
      throw new Error("Error fetching data: " + error.message);
    }
  }
}
