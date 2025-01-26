import {Model} from "mongoose";
import {v4 as uuid} from "uuid";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
  ConflictException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import config from "../config";
import * as sodium from "libsodium-wrappers";
import {comparePassword, hashPassword} from "../common/auth";
import {
  UserNotFoundException,
  EmailAlreadyUsedException,
  ActivationTokenInvalidException,
  DeletionException,
  NumberAlreadyUsedException,
} from "../common/exceptions";
import {JwtService} from "@nestjs/jwt";
import {UserMailerService} from "./user.mailer.service";
import {User, UserDocument} from "./user.schema";
import {EventEmitter2} from "@nestjs/event-emitter";
import {Post, PostDocument} from "../post/post.schema";
import {GenericService} from "../generic/generic.service";
import {OtpDocument} from "./otp.schema";
import {CloudinaryService} from "../post/cloudinary.service";
import axios from "axios";
import {showObjectProperties} from "./logistics.service";
import {TransactionDocument} from "./transaction.schema";
import {NotificationDocument} from "./notification.schema";
import {providers, Wallet, utils, ethers} from "ethers";
import {
  gonaAdminToken,
  gonaModuleRef,
  gonanaAccountBankName,
  gonanaAccountName,
  gonanaAccountNumber,
  gonanaAdminAddress,
  gonanaAdminPassword,
  gonanaAdminPhoneNumber,
  toronetBaseUrl,
  toronetHeaders,
} from "../common/enums";
import {ConcordiumService} from "./concordium.service";
import {AccountAddress} from "@concordium/node-sdk";
import {convertDateFormat} from "../common/helpers";

export const shuffleArray = <T>(array: T[]): T[] => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

@Injectable()
export class UserService extends GenericService<UserDocument> {
  constructor(
    //@ts-ignore
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    //@ts-ignore
    @InjectModel("Transactions")
    private readonly transactionModel: Model<TransactionDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("Otp") private readonly otpModel: Model<OtpDocument>,
    //@ts-ignore
    @InjectModel("Notifications")
    private readonly notificationModel: Model<NotificationDocument>,
    private readonly jwtService: JwtService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly userMailer: UserMailerService,
    private readonly ccdService: ConcordiumService,
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
    country: string,
    //imageFile: Express.Multer.File,
  ) {
    // const image = await this.cloudinaryService.uploadImage(imageFile);
    const emailExists = await this.userModel.findOne({email: email});
    if (emailExists) {
      throw EmailAlreadyUsedException();
    }
    const numberExists = await this.userModel.findOne({phone: phone});
    if (numberExists) {
      throw NumberAlreadyUsedException();
    }

    const user = await this.userModel.create({
      email: email.toLowerCase(),
      first_name,
      last_name,
      phone,
      account_type,
      password: await hashPassword(password),
      activationToken: uuid(),
      activationExpires: Date.now() + config.auth.activationExpireInMs,
      country,
      //   image,
    });

    // on account created
    this.eventEmitter.emit("account.created", {
      user,
      origin,
    });

    return user;
  }

  async findById(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw UserNotFoundException();
    }

    return user;
  }
  async deleteUser(email: string, passcode: string) {
    try {
      const verifyPasscode = await this.verifyPasscode(email, passcode);

      if (!verifyPasscode) {
        throw new BadRequestException("Invalid Passcode");
      }
      const user = await this.findByEmail(email);
      if (!user) {
        throw new NotFoundException("User does not exist");
      }
      const deletedUser = await this.userModel.deleteOne({email: email});
      if (!deletedUser) {
        throw DeletionException();
      }
      const id = user.user.id;

      await this.postModel.deleteMany({publisher_id: id});
      const deleteOtp = await this.otpModel.deleteOne({email: email});
      if (!deleteOtp) {
        throw DeletionException();
      }
      return {
        success: true,
        message: "User deleted successfully",
      };
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async handleWebhook(event:string){
    if(event === "transfer"){
      console.log("Transfer event");
      
      
    }
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

  async findByEmail(email: string) {
    const user = await this.userModel.findOne(
      {email: email.toLowerCase()},
      "+password",
    );

    if (!user) {
      throw UserNotFoundException();
    }

    return {user, data: user.getPublicData()};
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

  async forgottenPassword(email: string) {
    const user = await this.userModel.findOne({email: email});
    const otpExists = await this.otpModel.findOne({email: email});
    if (otpExists) {
      await this.otpModel.deleteOne({email: email});
    }
    if (!user) {
      throw new NotFoundException(`User with email ${email} not found`);
    }
    const otp = this.generateOtp();
    await this.createOtpModel(email, otp);

    // trigger passwor update
    this.eventEmitter.emit("forgot.password", {email, otp});

    return {success: true, message: `Otp sent`};
  }

  async verifyPasswordOtp(otp: string) {
    const isValid = await this.otpModel.findOne({otp: otp});
    if (!isValid) {
      throw new NotFoundException(`Otp Invalid`);
    }
    this.eventEmitter.emit("verifyPasswordOtp", isValid.email);
    return {success: true, message: `Otp valid`, email: isValid.email};
  }

  async resetPassword(email: string, password: string) {
    const user = await this.userModel.findOne({email: email});
    if (!user) {
      throw new NotFoundException(`account does not exist`);
    }
    user.password = await hashPassword(password);
    await user.save();
    this.eventEmitter.emit("account.password.updated", email);

    return {success: true, message: `Password updated successfully`};
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
      const otpExists = await this.otpModel.findOne({email: email});
      if (otpExists) {
        await this.otpModel.deleteOne({email: email});
      }
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
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
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
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message:
            "This is Impossible, You should never see this, What are you doing?",
        },
        error.status,
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
        return {success: true, data: user.getPublicData()};
      }
      throw new NotFoundException("User Not Found");
    } catch (e: any) {
      console.error(e);
      throw new HttpException(
        {
          sucess: false,
          message: e.message,
        },
        e.status || 400,
      );
    }
  }

  async updateUserDetails(id: string, details: any) {
    try {
      const updatedUser = await this.updateUser(id, details);
      return updatedUser;
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 400,
      );
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
    if (user.passcode.length > 1) {
      throw new BadRequestException(`You already have a passcode`);
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
    const user = await this.userModel.findOne({email: email});
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

  async resetPasscode(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException(`Login and try again`);
      }
      const otp = this.generateOtp();
      await this.createOtpModel(user.email, otp);
      this.userMailer.sendOTP(user.email, otp);
      return {success: true, message: `Reset otp sent to ${user.email}`};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async verifyPasscodeOtp(otp: string, passcode: string) {
    try {
      const otpModel = await this.otpModel.findOne({otp: otp});
      if (!otpModel) {
        throw new BadRequestException(`Invalid otp`);
      }
      const user = await this.userModel.findOne({email: otpModel.email});
      if (!user) {
        throw new BadRequestException(`User not Found`);
      }
      const passCodeHash = await hashPassword(passcode);
      user.passcode = passCodeHash;
      await user.save();
      await this.otpModel.deleteOne({email: otpModel.email});
      return {success: true, message: `Passcode Reset Successfully`};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async getUserData(id: string) {
    try {
      const user = await this.userModel.findById(id);
      const url = "https://sepolia-rollup.arbitrum.io/rpc";
      const provider = new providers.JsonRpcProvider(url);
      if (!user) {
        return null;
      }
      if (!user.referral_code?.length) {
        user.referral_code = await this.generateUniqueReferralCode();
      }
      if (
        user.fiat_wallet_address === undefined ||
        user.fiat_wallet_address.length < 1
      ) {
        const data = {
          op: "createkey",
          params: [
            {
              name: "pwd",
              value: `${user.email}`,
            },
          ],
        };
        const toronetResponse = await axios.post(
          `${process.env.TORONET_BASE_URL}/keystore`,
          data,
          {
            headers: toronetHeaders,
          },
        );
        const fiat_wallet_address = toronetResponse.data.address;
        user.fiat_wallet_address = fiat_wallet_address;
      }
      if (
        user.arbitrum_wallet_address === undefined ||
        user.arbitrum_wallet_address === null
      ) {
        const wallet = Wallet.createRandom();
        const address = wallet.address;
        const balance = await provider.getBalance(address);
        const privateKey = wallet.privateKey;

        user.arbitrum_wallet = balance.toString();
        user.arbitrum_wallet_address = address;
        user.arbitrumPrivateKey = privateKey;

        const ngn = await this.convertEthToNgn(user.arbitrum_wallet);
        const usd = await this.convertNgntoUsd(ngn);
        user.arbitrumWalletBalanceInUsd = usd;
        user.arbitrumWalletBalanceInNgn = ngn;
      }

      if (
        user.ccd_wallet_address === undefined ||
        user.ccd_wallet_address === null
      ) {
        const wallet = await this.ccdService.getOrCreateConcordiumKeyPairs(id);
        const address = wallet.publicKey;
        const balance = await this.ccdService.ccdBalanceOf(id);
        const privateKey = wallet.privateKey;

        user.ccd_wallet = balance.toString();
        user.ccd_wallet_address = address;
        user.ccdPrivateKey = privateKey;
      }
      const userData = user?.getPublicData();

      if (userData) {
        user.ccdWalletBalanceInNgn = await this.convertCcdtoNgn(
          user.ccd_wallet,
        );
        console.log(user.ccdWalletBalanceInNgn);
      }
      await user.save();
      return userData;
    } catch (error: any) {
      console.error(error);

      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async getByEmail(email: string) {
    const user = await this.userModel.findOne({email: email});

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.getUserData(user.id);
  }

  async generateTokenByEmail(email: string) {
    const user = await this.userModel.findOne({email: email});

    if (!user) {
      throw new NotFoundException("User not found");
    }
    const token = this.jwtService.sign(
      {...user.getPublicData()},
      {subject: `${user.id}`},
    );
    return {user: user.getPublicData(), token: token};
  }

  // async generateToken() {
  //   try {
  //     const base_url = process.env.MINTYN_BASE_URL;
  //     const id = process.env.MERCHANT_ID;
  //     const secret = process.env.MINTYN_SECRET;
  //     const tokenUrl = `${base_url}/api/v1/authorization/generate-token/${id}`;
  //     const tokenHeaders = {
  //       "secret-key": secret,
  //     };

  //     const response = await axios.get(tokenUrl, {headers: tokenHeaders});

  //     if (!response.data.data.token) {
  //       throw new InternalServerErrorException(response.data.message);
  //     }
  //     const token = response.data.data.token;
  //     return token;
  //   } catch (error: any) {
  //     console.error(error);
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message,
  //       },
  //       error.status,
  //     );
  //   }
  // }

  async generateToken() {
    try {
      const url = `${process.env["9PSB_BASE_URL"]}/authenticate`;
      const username = process.env["9PSB_USERNAME"];
      const password = process.env["9PSB_PASSWORD"];
      const clientId = process.env["9PSB_CLIENT_ID"];
      const clientSecret = process.env["9PSB_CLIENT_SECRET"];
      const request = await axios.post(url, {
        username,
        password,
        clientId,
        clientSecret,
      });
      if (request.data.message !== "successful") {
        throw new InternalServerErrorException("Failed To Authenticate");
      }
      return request.data.accessToken;
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  // async virtualAccount(bvn: string, id: string) {
  //   const base_url = process.env.MINTYN_BASE_URL;
  //   try {
  //     const token = await this.generateToken();
  //     if (!token) {
  //       throw new InternalServerErrorException("Failed To Get Token");
  //     }
  //     const accountHeaders = {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     };
  //     const user = await this.userModel.findById(id);
  //     if (!user) {
  //       throw new NotFoundException(`User Not Found, Login and try again`);
  //     }
  //     if (bvn.length !== 11) {
  //       throw new BadRequestException("Bvn should be 11 digits");
  //     }
  //     const bvnExists = await this.userModel.findOne({bvn: bvn});
  //     if (bvnExists && bvnExists.id !== user.id) {
  //       throw new ConflictException(`Gonana user with this bvn exists`);
  //     }
  //     const data = {
  //       customerFirstName: `${user.first_name} ${user.last_name}`,
  //       customerBVN: bvn,
  //     };

  //     const accountUrl = `${base_url}/api/v1/merchant/virtual-account/reserved-account`;
  //     const createAccount = await axios.post(accountUrl, data, {
  //       headers: accountHeaders,
  //     });

  //     console.log(createAccount.data);
  //     if (createAccount.data.data === null) {
  //       console.log(createAccount.data);
  //       this.userMailer.sendBvnVerificationFailedMail(
  //         user.email,
  //         `${createAccount.data.responseMessage}. Login again and check your verification status`,
  //       );
  //       throw new HttpException(
  //         {
  //           success: false,
  //           message: createAccount.data.responseMessage,
  //         },
  //         400,
  //       );
  //     }
  //     user.bvn = bvn;
  //     user.virtual_account_number = createAccount.data.data.accountNumber;
  //     user.virtual_account_bank_name = createAccount.data.data.bankName;
  //     user.virtual_account_name = createAccount.data.data.accountName;
  //     await user.save();

  //     return createAccount.data;
  //   } catch (error: any) {
  //     console.log(error);
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message,
  //       },
  //       error.status,
  //     );
  //   }
  // }

  ////// TORONET IMPLEMENTATION
  // async virtualAccount(userId: string) {
  //   try {
  //     const user = await this.userModel.findById(userId);
  //     if (!user) {
  //       throw new BadRequestException("Login and try again");
  //     }
  //     if (!user.fiat_wallet_address) {
  //       throw new BadRequestException("Login and try again");
  //     }
  //     const toroData = {
  //       op: "generatevirtualwallet",
  //       params: [
  //         {
  //           name: "address",
  //           value: `${user.fiat_wallet_address}`, //wallet address
  //         },
  //         {
  //           name: "payername",
  //           value: `${user.first_name} ${user.last_name}`, //name of the account holder
  //         },
  //         {
  //           name: "currency",
  //           value: "NGN", //current options are USD, EUR, NGN - default
  //         },
  //       ],
  //     };
  //     const baseUrl = process.env.TORONET_BASE_URL;

  //     const toronetRequest = await axios.post(
  //       `${baseUrl}/payment/toro/`,
  //       toroData,
  //       {headers: toronetHeaders},
  //     );
  //     if (toronetRequest.data.result === false) {
  //       throw new BadRequestException(toronetRequest.data.error);
  //     }

  //     user.virtual_account_bank_name = toronetRequest.data.bankname;
  //     user.virtual_account_name = toronetRequest.data.accountname;
  //     user.virtual_account_number = toronetRequest.data.accountnumber;
  //     await user.save();
  //     return toronetRequest.data;
  //   } catch (error: any) {
  //     console.error(error);
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message,
  //       },
  //       error.status,
  //     );
  //   }
  // }

  ////// 9PSB IMPLEMENTATION
  async virtualAccount(
    userId: string,
    gender: number,
    bvn?: string,
    dob?: string,
    address?: string,
  ) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException("Login and try again");
      }
      if (!user.bvn && !bvn) {
        throw new BadRequestException("Invalid Bvn");
      }
      if (
        (!Array.isArray(user.address) || !user.address[0]?.address) &&
        !address
      ) {
        throw new BadRequestException("Invalid address");
      }

      if (!user.date_of_birth && !dob) {
        throw new BadRequestException("Invalid date of birth");
      }
      const bvnExists = await this.userModel.findOne({bvn: bvn});
      if (bvnExists && bvnExists.id !== user.id) {
        throw new ConflictException(`Gonana user with this bvn exists`);
      }
      if (user.date_of_birth) {
        const convertedDate = convertDateFormat(user.date_of_birth);
        user.date_of_birth = convertedDate;
      }
      console.log(user.phone);

      const url = `${process.env["9PSB_BASE_URL"]}/open_wallet`;
      user.gender = gender[gender];
      const data = {
        bvn: user.bvn || bvn,
        dateOfBirth: user.date_of_birth || dob,
        address:
          Array.isArray(user.address) && user.address[0]?.address
            ? user.address[0].address
            : address,
        gender: gender,
        lastName: user.last_name,
        otherNames: user.first_name,
        email: user.email,
        transactionTrackingRef: user.email,
        phoneNo: user.phone,
      };
      const token = await this.generateToken();

      const request = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      user.virtual_account_bank_name = "9 Payment Service Bank";
      user.virtual_account_name = request.data.data.fullName;
      user.virtual_account_number = request.data.data.accountNumber;
      await user.save();
      return request.data;
    } catch (error) {
      console.error(error.response.data);
      throw new HttpException(
        {
          success: false,
          message: error.response.data.message,
        },
        400,
      );
    }
  }

  async transferToEscrowFromUser(amount: string, userId: string) {
    await this.getUserBalance(userId);
    const user = await this.userModel.findById(userId);
    if (!user)
      throw new BadRequestException("Login and try again, Invalid token");
    if (user.balance < parseFloat(amount)) {
      throw new BadRequestException(`Insufficient funds`);
    }
    const data = {
      op: "transfer",
      params: [
        {
          name: "client",
          value: `${user.fiat_wallet_address}`,
        },
        {
          name: "clientpwd",
          value: `${user.email}`,
        },
        {
          name: "to",
          value: "0x2d113511a9a64744a3424e9614534bd037bbf1a8",
        },
        {
          name: "val",
          value: amount,
        },
      ],
    };

    console.log(data);

    const res = await axios.post(`${toronetBaseUrl}/currency/naira/cl`, data, {
      headers: toronetHeaders,
    });
    console.log(res.data);
    if (res.data.result !== true) {
      throw new BadRequestException(res.data.error);
    }
    return res.data.data;
  }

  async transferFromEscrowToUser(userId: string, amount: string) {
    const user = await this.userModel.findById(userId);
    if (!user) return;
    const toroData = {
      op: "updatevirtualwallettransactions",
      params: [
        {
          name: "walletaddress",
          value: gonanaAccountNumber, //blockchain address
        },
      ],
    };
    await axios.post(`${toronetBaseUrl}/payment`, toroData, {
      headers: toronetHeaders,
    });

    const narration = "Order Settlement from Gonana";
    const data = {
      op: "transfer",
      params: [
        {
          name: "client",
          value: gonanaAdminAddress,
        },
        {
          name: "clientpwd",
          value: gonanaAdminPassword,
        },
        {
          name: "to",
          value: `${user.fiat_wallet_address}`,
        },
        {
          name: "val",
          value: amount,
        },
      ],
    };

    console.log(data);

    const res = await axios.post(`${toronetBaseUrl}/currency/naira/cl`, data, {
      headers: toronetHeaders,
    });
    console.log(res.data);
    if (res.data.result !== true) {
      throw new BadRequestException(res.data.error);
    }
    const creditMessage = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {
        en: `You have received ₦${amount} from Gonana`,
      },
      headings: {en: "Credit Notification from Order"},
      included_segments: ["include_player_ids"],
      include_player_ids: [user.onesignal_id],
      content_available: true,
      small_icon:
        "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
    };
    await this.sendNotificationToDevice(creditMessage, user.id);
    return res.data;
  }

  // async verifyTransaction(data: any) {
  //   console.log(data);

  //   const user = await this.userModel.findOne({bvn: data.payload.customerBVN});
  //   if (!user) {
  //     console.log("email not sent");
  //     return {success: false, message: "Email not sent"};
  //   }
  //   const session_id = data.payload.sessionId;

  //   const email = user.email;
  //   try {
  //     this.userMailer.transactionVerification(
  //       email,
  //       data.eventType,
  //       data.payload.transactionAmount,
  //     );

  //     setTimeout(() => {
  //       this.confirmTransaction(session_id, email);
  //     }, 300000);
  //     return {success: true, message: `Notification sent to ${email}`};
  //   } catch (error: any) {
  //     console.error(error);
  //     return {success: false, error: error.message};
  //   }
  // }
  // async confirmTransaction(session_id: string, email: string) {
  //   try {
  //     const user = await this.userModel.findOne({email: email});
  //     if (!user) {
  //       console.log("User not found");
  //       return;
  //     }
  //     const token = await this.generateToken();
  //     const Headers = {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     };
  //     const base_url = process.env.MINTYN_BASE_URL;
  //     const url = `${base_url}/api/v1/merchant/virtual-account/verify-transaction?sessionId=${session_id}`;
  //     const res = await axios.get(url, {headers: Headers});

  //     if (res.data.data.settlementStatus !== "SETTLED") {
  //       console.log(res.data.data);
  //       console.log(
  //         `Transaction with sessionId:${session_id} is still pending`,
  //       );
  //       const transactionObject = {
  //         userId: user.id,
  //         Session_id: session_id,
  //         Type: "PENDING" as const,
  //         AmountSent: res.data.data.transactionAmount,
  //         AmountSettled: res.data.data.amountSettled,
  //         Time: res.data.data.transactionTime,
  //       };
  //       const transactions = await this.transactionModel.findOne({
  //         userId: user.id,
  //       });

  //       if (!transactions) {
  //         transactionObject.userId = user.id;
  //         const transaction = await this.transactionModel.create(
  //           transactionObject,
  //         );
  //         transaction.transactions.push(transactionObject);
  //         await transaction.save();
  //         return;
  //       }

  //       transactions.transactions.push(transactionObject);
  //       await transactions.save();
  //       return;
  //     }

  //     const transactionObject = {
  //       userId: user.id,
  //       Session_id: session_id,
  //       Type: "CREDIT",
  //       AmountSent: res.data.data.transactionAmount,
  //       AmountSettled: res.data.data.amountSettled,
  //       Time: res.data.data.transactionTime,
  //     };

  //     // Handle updating the user balance and saving the transaction asynchronously
  //     await this.updateUserBalanceAndSaveTransaction(user, transactionObject);

  //     const transactionAmount = transactionObject.AmountSettled;
  //     this.userMailer.transactionSucess(email, transactionAmount);

  //     return true;
  //   } catch (error) {
  //     console.error(error);
  //     return;
  //   }
  // }

  async updateUserBalanceAndSaveTransaction(user: any, transactionObject: any) {
    const balance =
      parseInt(user.balance) + parseInt(transactionObject.AmountSettled);
    user.balance = balance;
    await user.save();

    const transactions = await this.transactionModel.findOne({userId: user.id});

    if (!transactions) {
      transactionObject.userId = user.id;
      const transaction = await this.transactionModel.create(transactionObject);
      transaction.transactions.push(transactionObject);
      await transaction.save();
      return;
    }

    transactions.transactions.push(transactionObject);
    await transactions.save();

    return;
  }

  async getBanks() {
    try {
      ///TORONET IMPLEMENTATION
      // const base_url = process.env.TORONET_BASE_URL;
      // const url = `${base_url}/payment/toro/`;
      // const toroData = {
      //   op: "getbanklist_ngn",
      //   params: [],
      // };
      const url = `${process.env["9PSB_BASE_URL"]}/get_banks`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${await this.generateToken()}`,
          "Content-Type": "application/json",
        },
      });
      const banks = response.data.data.bankList as any[];
      const sortedBanks = banks.sort((a: any, b: any) => {
        return a.bankName.toLowerCase().localeCompare(b.bankName.toLowerCase());
      });
      return {success: true, data: sortedBanks};
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async saveAccountNumber(
    account_number: string,
    bank: string,
    user_id: string,
  ) {
    try {
      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new UnauthorizedException("Login and try again");
      }

      const res = await this.resolveAccountNumber(account_number, bank);

      let account_details = res.data.data;
      console.log(account_details);

      const isDuplicate = user.account_details.some(existingAccount => {
        return existingAccount.accountNumber === account_details.accountNumber;
      });

      if (isDuplicate) {
        throw new BadRequestException("Account number already exists");
      }
      account_details = {
        accountName: account_details.accountName,
        accountNumber: account_details.accountNumber,
        bankName: bank,
      };
      user.account_details.push(account_details);
      await user.save();
      return {success: true, beneficiaries: user.account_details};
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async getBankCode(bank_name: string) {
    ////TORONET IMPLEMENTATION
    try {
      const banks = (await this.getBanks()).data;
      const bank = banks.find((bank: any) => {
        const bankNameLower = bank_name.toLowerCase();
        return (
          bank.bankName.toLowerCase() === bankNameLower ||
          (bank.bankShortName &&
            bank.bankShortName.toLowerCase() === bankNameLower)
        );
      });
      if (!bank) {
        throw new NotFoundException("Bank Not Found");
      }
      console.log(`bank gotten:`, bank);
      return bank.bankCode;
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }

    ////MINTYN IMPLEMENTATION
    // try {
    //   const token = await this.generateToken();
    //   const bankHeaders = {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   };
    //   const base_url = process.env.MINTYN_BASE_URL;
    //   const url = `${base_url}/api/v1/merchant/transfer-service/banks`;
    //   const response = await axios.get(url, {headers: bankHeaders});
    //   const banks = response.data.data;
    //   const bank = banks.find(
    //     (bank: any) => bank.name.toLowerCase() === bank_name.toLowerCase(),
    //   );
    //   if (!bank) {
    //     throw new NotFoundException("Bank Not Found");
    //   }
    //   return bank.code;
    // } catch (error: any) {
    //   console.error(error);
    //   throw new HttpException(
    //     {
    //       success: false,
    //       message: error.message,
    //     },
    //     error.status,
    //   );
    // }
  }

  // async recoverVirtualAccount(bvn: string, userId: string) {
  //   try {
  //     const token = await this.generateToken();
  //     if (!token) {
  //       throw new InternalServerErrorException("Failed To Get Token");
  //     }
  //     const accountHeaders = {
  //       Authorization: `Bearer ${token}`,
  //       "Content-Type": "application/json",
  //     };
  //     const user = await this.userModel.findById(userId);

  //     if (!user) {
  //       throw new NotFoundException(`User Not Found, Login and try again`);
  //     }

  //     // if (user.bvn !== undefined) {
  //     //   `You have already generated a virtual account`;
  //     // }

  //     if (bvn.length !== 11) {
  //       throw new BadRequestException("Bvn should be 11 digits");
  //     }
  //     const bvnExists = await this.userModel.findOne({bvn: bvn});

  //     if (bvnExists && bvnExists?.id !== userId) {
  //       throw new BadRequestException(
  //         `Another Gonana Account is already associated with this bvn`,
  //       );
  //     }

  //     const base_url = process.env.MINTYN_BASE_URL;

  //     const url = `${base_url}/api/v1/merchant/virtual-account/accounts?bvn=${bvn}&page=0&size=100`;
  //     const response = await axios.get(url, {headers: accountHeaders});
  //     if (response.data.data.records.length < 1) {
  //       throw new BadRequestException("Bvn not previously validated");
  //     }
  //     user.virtual_account_bank_name = response.data.data.records[0].bankName;
  //     user.bvn = response.data.data.records[0].bvn;
  //     user.virtual_account_name = response.data.data.records[0].accountName;
  //     user.virtual_account_number = response.data.data.records[0].accountNumber;
  //     await user.save();
  //     return {
  //       success: true,
  //       message: "Virtual Account Recovered",
  //       accountDetails: {
  //         accountNumber: user.virtual_account_number,
  //         accountName: user.virtual_account_name,
  //         bankName: user.virtual_account_bank_name,
  //       },
  //     };
  //   } catch (error: any) {
  //     console.log(error);
  //     throw new HttpException(
  //       {
  //         success: false,
  //         message: error.message,
  //       },
  //       error.status,
  //     );
  //   }
  // }

  async resolveAccountNumber(account_number: string, bank: string) {
    try {
      ///  TORONET IMPLEMENTATION
      const bankCode = await this.getBankCode(bank);
      console.log(bankCode);
      // const toroData = {
      //   op: "verifybankaccountname_ngn",
      //   params: [
      //     {
      //       name: "destinationInstitutionCode",
      //       value: bankCode, //destinationInstitutionCode
      //     },
      //     {
      //       name: "accountNumber",
      //       value: account_number,
      //     },
      //   ],
      // };

      const url = `${process.env["9PSB_BASE_URL"]}/other_banks_enquiry`;
      const response = await axios.post(
        url,
        {
          customer: {
            account: {
              bank: bankCode,
              number: account_number,
            },
          },
        },
        {
          headers: {
            Authorization: `Bearer ${await this.generateToken()}`,
            "Content-Type": "application/json",
          },
        },
      );
      // if (response.data.data === null) {
      //   throw new HttpException(
      //     {
      //       success: false,
      //       message: response.data.responseMessage,
      //     },
      //     400,
      //   );
      // }

      return {success: true, data: response.data, bankCode: bankCode};
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }

    /// MINTYN IMPLEMENTATION
    // try {
    //   const bankCode = await this.getBankCode(bank);
    //   console.log(bankCode);

    //   const token = await this.generateToken();
    //   const bankHeaders = {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   };

    //   const base_url = process.env.MINTYN_BASE_URL;
    //   const url = `${base_url}/api/v1/merchant/transfer-service/resolve-account?accountNumber=${account_number}&bankCode=${bankCode}`;
    //   const response = await axios.get(url, {headers: bankHeaders});
    //   if (response.data.data === null) {
    //     throw new HttpException(
    //       {
    //         success: false,
    //         message: response.data.responseMessage,
    //       },
    //       400,
    //     );
    //   }
    //   return {success: true, data: response.data, bankCode: bankCode};
    // } catch (error: any) {
    //   console.log(error);
    //   throw new HttpException(
    //     {
    //       success: false,
    //       message: error.message,
    //     },
    //     error.status,
    //   );
    // }
  }

  async getUserBalance(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found, Login and Try again.");
      }
      const token = await this.generateToken();
      const url = `${process.env["9PSB_BASE_URL"]}/wallet_enquiry`;
      if (!user.virtual_account_number) {
        throw new BadRequestException(
          "User has not generated a virtual account",
        );
      }
      const request = await axios.post(
        url,
        {
          accountNo: `${user.virtual_account_number}`,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      user.balance = request.data.data.availableBalance;

      await user.save();
      return {
        success: true,
        balance: user.balance,
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async kycVerification(userId: string, dob: string, bvn?: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException("User not found, Login and Try again.");
      }
      if (!user.bvn && !bvn) {
        throw new BadRequestException("Invalid Bvn");
      }

      if (!user.fiat_wallet_address) {
        throw new BadRequestException("Login and try again");
      }
      const bvnExists = await this.userModel.findOne({bvn: bvn});
      if (bvnExists && bvnExists.id !== user.id) {
        throw new ConflictException(`Gonana user with this bvn exists`);
      }
      const toroData = {
        op: "check_kyc",
        params: [
          {
            name: "currency",
            value: "NGN", //current options are NGN
          },
          {
            name: "bvn",
            value: user.bvn || bvn,
          },
          {
            name: "firstName",
            value: user.first_name,
          },
          {
            name: "lastName",
            value: user.last_name,
          },
          {
            name: "middleName",
            value: "",
          },
          {
            name: "phoneNumber",
            value: user.phone,
          },
          {
            name: "dob",
            value: dob,
          },
          {
            name: "address",
            value: user.fiat_wallet_address,
          },
        ],
      };

      const res = await axios.post(
        `${toronetBaseUrl}/payment/toro/`,
        toroData,
        {headers: toronetHeaders},
      );
      console.log(toroData);

      console.log(res.data);

      if (res.data.result === false) {
        throw new BadRequestException(res.data.error);
      }
      if (res.data.data.passed === false) {
        const failedProps = Object.keys(res.data.data).filter(
          key => res.data.data[key] === "N",
        );
        if (failedProps.includes("dob")) {
          throw new BadRequestException(
            "Date of Birth provided does not match the one associated with your bvn",
          );
        } else {
          throw new BadRequestException(
            `${failedProps.join(
              ", ",
            )} in your profile does not match the one associated with your bvn`,
          );
        }
      }
      user.date_of_birth = dob;
      if (!user.bvn && bvn) {
        user.bvn = bvn as string;
        await user.save();
      }
      await user.save();
      return {
        success: true,
        message: "Kyc completed",
      };
    } catch (error: any) {
      console.log("error:", error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
          data: error.response.data,
        },
        error.status,
      );
    }
  }
  async getCustomers(id: string) {
    const farmer = await this.userModel.findById(id);
    if (!farmer) {
      throw new NotFoundException("User not found");
    }
    return {success: true, data: farmer.patrons};
  }
  async getUserTransactions(id: string, page?: string, limit?: string) {
    const transactionsPerPage = 10; // Set your desired page size here

    let numberPage;
    // If page is not provided or less than 1, default to 1
    if (page) {
      numberPage = parseInt(page, 10);
    }
    const pageNumber = numberPage && numberPage > 0 ? numberPage : 1;

    // Calculate the number of documents to skip
    const skips = transactionsPerPage * (pageNumber - 1);
    let numberLimit;
    if (limit) {
      numberLimit = parseInt(limit, 10);
    }
    // Use the aggregate pipeline to skip, limit, and unwind the results
    const transaction = await this.transactionModel.aggregate([
      {$match: {userId: id}},
      {$unwind: "$transactions"},
      {$skip: skips},
      {
        $limit: numberLimit
          ? Math.min(transactionsPerPage, numberLimit)
          : transactionsPerPage,
      },
    ]);

    if (!transaction || transaction.length === 0) {
      return {success: true, message: "Transactions not found"};
    }

    return {success: true, transactions: transaction};
  }

  async getCcdTransactions(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new NotFoundException("Invalid Token");
      }
      const ccdTransaction = await this.transactionModel.findOne({
        userId: userId,
      });
      const ccdTransactionsArray = ccdTransaction.transactions;
      const ccdTransactions = ccdTransactionsArray.filter(
        transaction => transaction.currency === "CCD",
      );

      return {success: true, transactions: ccdTransactions};
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async transfer(
    user_id: string,
    accountNumber: string,
    bankName: string,
    amount: number,
    account_name: string,
    narration?: string,
    debitProperty?: object,
  ) {
    //// 9PSB IMPLEMENTATION
    try {
      await this.getUserBalance(user_id);
      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new NotFoundException("user not found. login and try again");
      }

      //@ts-ignore
      const balance = parseFloat(user.balance);
      console.log(balance);
      if (balance < amount) {
        throw new BadRequestException("Insuffient balance");
      }
      const resolve = await this.resolveAccountNumber(accountNumber, bankName);
      const bankCode = resolve.bankCode;
      const data = {
        customer: {
          account: {
            bank: bankCode,
            name: account_name,
            number: accountNumber,
            senderaccountnumber: `${user.virtual_account_number}`,
            sendername: `${user.first_name} ${user.last_name}`,
          },
        },
        narration: narration || "",
        order: {
          amount: amount.toString(),
          country: "NGA",
          currency: "NGN",
          description: narration || "",
        },
        transaction: {
          reference: this.generateRandomString(25),
        },
        merchant: {
          isFee: false,
          merchantFeeAccount: `${process.env["9PSB_TEST_FEE_ACCOUNT"]}`,
          merchantFeeAmount: "0",
        },
      };
      console.log(data);
      const url = `${process.env["9PSB_BASE_URL"]}/wallet_other_banks`;
      const request = await axios.post(url, data, {
        headers: {
          Authorization: `Bearer ${await this.generateToken()}`,
          "Content-Type": "application/json",
        },
      });
      console.log(request.data);
      return request.data
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
    //// TORONET IMPLEMENTATION
    // try {
    //   await this.getUserBalance(user_id);
    //   const user = await this.userModel.findById(user_id);
    //   if (!user) {
    //     throw new NotFoundException("user not found. login and try again");
    //   }

    //   //@ts-ignore
    //   const balance = parseFloat(user.balance);
    //   console.log(balance);
    //   const updatedAmount = amount + 10;
    //   if (balance < updatedAmount) {
    //     throw new BadRequestException("Insuffient balance");
    //   }
    //   const resolve = await this.resolveAccountNumber(accountNumber, bankName);
    //   const bankCode = resolve.bankCode;

    //   const data = {
    //     op: "recordfiatwithdrawal",
    //     params: [
    //       {
    //         name: "addr",
    //         value: user.fiat_wallet_address,
    //       },
    //       {
    //         name: "pwd",
    //         value: user.email,
    //       },
    //       {
    //         name: "currency",
    //         value: "NGN",
    //       },
    //       {
    //         name: "token",
    //         value: "NGN",
    //       },
    //       {
    //         name: "payername",
    //         value: `${user.first_name} ${user.last_name}`,
    //       },
    //       {
    //         name: "payeremail",
    //         value: user.email,
    //       },
    //       {
    //         name: "payeraddress",
    //         value: "nil",
    //       },
    //       {
    //         name: "payercity",
    //         value: "nil",
    //       },
    //       {
    //         name: "payerstate",
    //         value: "nil",
    //       },
    //       {
    //         name: "payercountry",
    //         value: "NG",
    //       },
    //       {
    //         name: "payerzipcode",
    //         value: "nil",
    //       },
    //       {
    //         name: "payerphone",
    //         value: user.phone,
    //       },
    //       {
    //         name: "description",
    //         value: narration,
    //       },
    //       {
    //         name: "amount",
    //         value: updatedAmount.toString(),
    //       },
    //       {
    //         name: "accounttype",
    //         value: "ach",
    //       },
    //       {
    //         name: "bankname",
    //         value: bankName,
    //       },
    //       {
    //         name: "routingno",
    //         value: "nil",
    //       },
    //       {
    //         name: "accountno",
    //         value: accountNumber,
    //       },
    //       {
    //         name: "expirydate",
    //         value: "nil",
    //       },
    //       {
    //         name: "accountname",
    //         value: account_name,
    //       },
    //       {
    //         name: "recipientstate",
    //         value: "nil",
    //       },
    //       {
    //         name: "recipientzip",
    //         value: "nil",
    //       },
    //       {
    //         name: "recipientphone",
    //         value: "nil",
    //       },
    //     ],
    //   };

    //   console.log("transfer request data:", data);

    //   const res = await axios.post(`${toronetBaseUrl}/payment/toro/`, data, {
    //     headers: toronetHeaders,
    //   });
    //   console.log("trasnfer request response:", res.data);
    //   if (res.data.result !== true) {
    //     throw new BadRequestException(res.data.error || res.data.message);
    //   }

    //   const transactionObject: Record<string, any> = {
    //     Session_id: res.data.data.data.sessionID || res.data.transactionid,
    //     userId: user.id,
    //     Type: "DEBIT" as const,
    //     AmountSettled: res.data.data.data.amount || updatedAmount,
    //     Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    //     accountNumber: accountNumber,
    //     accountName: account_name,
    //     bank: bankName,
    //   };

    //   if (narration !== undefined) {
    //     transactionObject.narration = narration;
    //   }
    //   const transaction = await this.transactionModel.findOne({
    //     userId: user.id,
    //   });
    //   if (!transaction) {
    //     await this.transactionModel.create(transactionObject);
    //     return {success: true, data: res.data};
    //   }
    //   const transactionArrayObject = {
    //     Session_id: res.data.data.data.sessionID || res.data.transactionid,
    //     Type: "DEBIT" as const,
    //     AmountSettled: res.data.data.data.amount || updatedAmount,
    //     AmountSent: res.data.data.data.amount || updatedAmount,
    //     Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
    //     accountNumber: accountNumber,
    //     accountName: account_name,
    //     bank: bankName,
    //   };
    //   transaction.transactions.push(transactionArrayObject);
    //   await transaction.save();
    //   const debitMessage = {
    //     app_id: process.env.ONESIGNAL_APP_ID,
    //     contents: {
    //       en: `₦${
    //         res.data.data.data.amount || updatedAmount
    //       } has been debited from your account`,
    //     },
    //     headings: {en: "Debit Notification"},
    //     included_segments: ["include_player_ids"],
    //     include_player_ids: [user.onesignal_id],
    //     content_available: true,
    //     small_icon:
    //       "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
    //   };
    //   if (debitProperty) {
    //     await this.sendNotificationToDevice(debitProperty, user.id);
    //   }
    //   await this.sendNotificationToDevice(debitMessage, user.id);
    //   return {success: true, data: res.data.data.data || res.data};
    // } catch (error: any) {
    //   console.log(error);
    //   throw new HttpException(
    //     {
    //       success: false,
    //       message: error.message,
    //     },
    //     error.status,
    //   );
    // }

    ////MINTYN IMPLEMENTATION
    // try {
    //   const user = await this.userModel.findById(user_id);
    //   if (!user) {
    //     throw new NotFoundException("user not found. login and try again");
    //   }
    //   //@ts-ignore
    //   const balance = parseInt(user.balance);
    //   console.log(balance);

    //   if (balance < amount) {
    //     throw new BadRequestException("Insuffient balance");
    //   }
    //   const resolve = await this.resolveAccountNumber(accountNumber, bankName);
    //   const bankCode = resolve.bankCode;
    //   const generateRandomString = () => {
    //     const characters =
    //       "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    //     let result = "";
    //     for (let i = 0; i < 12; i++) {
    //       const randomIndex = Math.floor(Math.random() * characters.length);
    //       result += characters.charAt(randomIndex);
    //     }
    //     return result;
    //   };
    //   const requestReference = generateRandomString();
    //   const nameEnquirySessionId = resolve.data.data.sessionId;
    //   const token = await this.generateToken();
    //   const Headers = {
    //     Authorization: `Bearer ${token}`,
    //     "Content-Type": "application/json",
    //   };
    //   const base_url = process.env.MINTYN_BASE_URL;
    //   const url = `${base_url}/api/v1/merchant/transfer-service/transfer`;

    //   const data: Record<string, any> = {
    //     bankCode: bankCode,
    //     requestReference: requestReference,
    //     amount: amount,
    //     accountNumber: accountNumber,
    //     nameEnquirySessionId: nameEnquirySessionId,
    //   };
    //   if (narration !== undefined) {
    //     data.narration = narration;
    //   }
    //   console.log(data);

    //   const res = await axios.post(url, data, {headers: Headers});
    //   console.log(res.data);

    //   if (res.data.responseCode === "02") {
    //     console.log(res.data);
    //     throw new HttpException(
    //       {
    //         success: false,
    //         message: res.data.responseMessage,
    //       },
    //       400,
    //     );
    //   }
    //   const newBalance = balance - parseInt(res.data.data.totalAmount);
    //   user.balance = newBalance;
    //   console.log(newBalance);
    //   await user.save();
    //   const transactionObject = {
    //     Session_id: res.data.data.reference,
    //     userId: user.id,
    //     Type: "DEBIT" as const,
    //     AmountSettled: res.data.data.totalAmount,
    //     AmountSent: amount,
    //     Time: res.data.data.transactionDate,
    //     narration: narration,
    //   };
    //   if (narration !== undefined) {
    //     transactionObject.narration = narration;
    //   }
    //   const transaction = await this.transactionModel.findOne({
    //     userId: user.id,
    //   });
    //   if (!transaction) {
    //     await this.transactionModel.create(transactionObject);
    //     return {success: true, data: res.data};
    //   }
    //   transaction.transactions.push(transactionObject);
    //   await transaction.save();
    //   console.log(transactionObject);

    //   console.log(transaction);

    //   return {success: true, data: res.data};
    // } catch (error: any) {
    //   console.log(error);
    //   throw new HttpException(
    //     {
    //       success: false,
    //       message: error.message,
    //     },
    //     error.status,
    //   );
    // }
  }

  async transferToUser(
    user_id: string,
    email: string,
    amount: number,
    narration?: string,
  ) {
    try {
      await this.getUserBalance(user_id);
      const crediter = await this.userModel.findById(user_id);
      if (!crediter) {
        throw new BadRequestException("Invalid Token");
      }
      if (crediter.balance < amount) {
        throw new BadRequestException("Insufficient funds");
      }
      const user = await this.userModel.findOne({email: email});
      if (!user) {
        throw new BadRequestException("User Not Found");
      }
      const data = {
        op: "transfer",
        params: [
          {
            name: "client",
            value: `${crediter.fiat_wallet_address}`,
          },
          {
            name: "clientpwd",
            value: `${crediter.email}`,
          },
          {
            name: "to",
            value: `${user.fiat_wallet_address}`,
          },
          {
            name: "val",
            value: `${amount}`,
          },
        ],
      };
      const res = await axios.post(
        `${toronetBaseUrl}/currency/naira/cl`,
        data,
        {headers: toronetHeaders},
      );
      console.log("transfer to user response", res.data.transaction);
      if (res.data.result !== true) {
        throw new BadRequestException(res.data.error);
      }
      const transactionObject: Record<string, any> = {
        Session_id: res.data.transaction,
        userId: crediter.id,
        Type: "DEBIT" as const,
        AmountSettled: amount,
        Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        accountNumber: user.virtual_account_number,
        accountName: user.virtual_account_name,
        bank: user.virtual_account_bank_name,
      };

      if (narration !== undefined) {
        transactionObject.narration = narration;
      }
      const transaction = await this.transactionModel.findOne({
        userId: crediter.id,
      });
      if (!transaction) {
        await this.transactionModel.create(transactionObject);
        return {success: true, data: res.data};
      }
      const transactionArrayObject = {
        Session_id: res.data.transaction,
        Type: "DEBIT" as const,
        AmountSettled: amount,
        AmountSent: amount,
        Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        accountNumber: user.virtual_account_number,
        accountName: user.virtual_account_name,
        bank: user.virtual_account_bank_name,
      };
      console.log(transactionArrayObject, transactionArrayObject);
      transaction.transactions.push(transactionArrayObject);
      await transaction.save();
      const debitMessage = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {
          en: `₦${amount} has been debited from your account`,
        },
        headings: {en: "Debit Notification"},
        included_segments: ["include_player_ids"],
        include_player_ids: [crediter.onesignal_id],
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };

      const creditMessage = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {
          en: `You have received ₦${amount} from ${crediter.first_name} ${crediter.last_name}`,
        },
        headings: {en: "Credit Notification"},
        included_segments: ["include_player_ids"],
        include_player_ids: [user.onesignal_id],
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };
      await this.sendNotificationToDevice(creditMessage, user.id);
      await this.sendNotificationToDevice(debitMessage, crediter.id);
      return {success: true, data: res.data};
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async roundToDecimalPlaces(num: number, decimals: number) {
    const factor = Math.pow(10, decimals);
    return Math.round(num * factor) / factor;
  }
  async getArbitrumWalletBalance(id: string) {
    try {
      if (!id) {
        throw new BadRequestException("Login and Try again");
      }
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found");
      }
      const url = "https://sepolia-rollup.arbitrum.io/rpc";
      const provider = new providers.JsonRpcProvider(url);

      if (
        user.arbitrum_wallet_address === undefined ||
        user.arbitrum_wallet_address === null
      ) {
        const wallet = Wallet.createRandom();
        const address = wallet.address;
        const balance = await provider.getBalance(address);
        const ethValue = ethers.utils.formatEther(balance);
        const privateKey = wallet.privateKey;

        user.arbitrum_wallet = ethValue;
        user.arbitrum_wallet_address = address;
        user.arbitrumPrivateKey = privateKey;
        console.log(balance.toString());
        const ngn = await this.convertEthToNgn(user.arbitrum_wallet);
        const usd = await this.convertNgntoUsd(ngn);
        user.arbitrumWalletBalanceInUsd = usd;
        user.arbitrumWalletBalanceInNgn = ngn;
        await user.save();
        return {
          success: true,
          cryptoWalletBalanceInNgn: ngn,
          cryptoWalletBalanceInEth: user.arbitrum_wallet,
        };
      }
      const balance = await provider.getBalance(user.arbitrum_wallet_address);

      const ethValue = ethers.utils.formatEther(balance);
      console.log(ethValue);
      const ngn = await this.convertEthToNgn(ethValue);
      const usd = await this.convertNgntoUsd(ngn);
      user.arbitrum_wallet = ethValue;
      user.arbitrumWalletBalanceInNgn = ngn;
      user.arbitrumWalletBalanceInUsd = usd;
      await user.save();
      return {
        success: true,
        cryptoWalletBalanceInNgn: user.arbitrumWalletBalanceInNgn,
        cryptoWalletBalanceInEth: user.arbitrum_wallet,
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async getCcdWalletBalance(id: string) {
    try {
      if (!id) {
        throw new BadRequestException("Login and Try again");
      }
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found");
      }
      // const url = "https://sepolia-rollup.arbitrum.io/rpc";
      // const provider = new providers.JsonRpcProvider(url);

      if (
        user.ccd_wallet_address === undefined ||
        user.ccd_wallet_address === null
      ) {
        // const wallet = Wallet.createRandom();
        // const address = wallet.address;
        // const balance = await provider.getBalance(address);
        // const privateKey = wallet.privateKey;

        // user.wallet = balance.toString();
        // user.wallet_address = address;
        // user.privateKey = privateKey;
        // await user.save();
        // const ngn = await this.convertEthToNgn(user.wallet);
        // return {
        //   success: true,
        //   cryptoWalletBalanceInNgn: ngn,
        //   cryptoWalletBalanceInEth: user.wallet,
        // };

        await this.ccdService.getOrCreateConcordiumKeyPairs(id);
        const balance = await this.ccdService.ccdBalanceOf(id);
        user.ccd_wallet = balance.toString();
        const ngn = await this.convertCcdtoNgn(user.ccd_wallet);
        await user.save();

        return {
          success: true,
          cryptoWalletBalanceInNgn: ngn,
          cryptoWalletBalanceInCcd: user.ccd_wallet,
        };
      }
      const balance = await this.ccdService.ccdBalanceOf(id);

      user.ccd_wallet = balance.toString();
      console.log(balance);
      const ngn = await this.convertCcdtoNgn(user.ccd_wallet);
      const usd = await this.convertNgntoUsd(ngn);
      user.ccdWalletBalanceInNgn = ngn;
      user.ccdWalletBalanceInUsd = usd;
      await user.save();
      console.log(`${user.first_name} ccdbalance is ${balance.toString()}`);
      return {
        success: true,
        cryptoWalletBalanceInNgn: ngn.toString(),
        cryptoWalletBalanceInCcd: user.ccd_wallet,
      };
    } catch (error: any) {
      console.log(error);
      showObjectProperties(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async convertArbitrumToNgn(xArb: string) {
    if (xArb === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xArb}&symbol=ARB&convert=NGN`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    return response.data.data.quote.NGN.price;
  }
  async convertEthToNgn(xEth: string) {
    if (xEth === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=ETH&convert=NGN",
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const oneEth = Math.round(response.data.data.quote.NGN.price);
    console.log(oneEth);

    const numEth = parseFloat(xEth);
    const ngn = numEth * oneEth;
    return ngn.toString();
  }
  async convertEthToUsd(xEth: string) {
    if (xEth === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xEth}&symbol=ETH&convert=USD`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const USD = response.data.data.quote.USD.price;

    return USD;
  }
  async convertArbToNgn(xARB: string) {
    if (xARB === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=ARB&convert=NGN",
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const oneARB = Math.round(response.data.data.quote.NGN.price);
    console.log(oneARB);

    const numARB = parseFloat(xARB);
    const ngn = numARB * oneARB;
    return ngn.toString();
  }

  async convertCcdtoUsd(xCcd: string) {
    if (xCcd === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xCcd}&symbol=CCD&convert=USD`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const usd = response.data.data.quote.USD.price;
    return usd;
  }
  async convertNgntoEth(xNgn: string) {
    if (xNgn === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xNgn}&symbol=NGN&convert=ETH`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    return response.data.data.quote.ETH.price;
  }

  async convertNgntoArb(xNgn: string) {
    if (xNgn === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=ARB&convert=NGN",
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const arb = parseInt(xNgn) / Math.round(response.data.data.quote.NGN.price);
    const roundedEth = this.roundToSignificantFigures(arb, 9);
    return roundedEth.toString();
  }

  async convertNgntoCcd(xNgn: string) {
    try {
      if (xNgn === "0") {
        return "0";
      }
      const key = process.env.COINMARKETCAP_API_KEY;
      const response = await axios.get(
        `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xNgn}&symbol=NGN&convert=CCD`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": key,
          },
        },
      );
      const ccd = response.data.data.quote.CCD.price;
      return ccd;
    } catch (error: any) {
      showObjectProperties(error.response.data.status);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async convertCcdtoNgn(xCcd: string) {
    if (xCcd === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xCcd}&symbol=CCD&convert=NGN`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const ngn = response.data.data.quote.NGN.price;
    return ngn;
  }

  roundToSignificantFigures(number: number, significantFigures: number) {
    if (number === 0) {
      return 0;
    }

    // Convert the number to decimal notation if it's in scientific notation
    const decimalNumber = parseFloat(number.toString());

    const exponent = Math.floor(Math.log10(Math.abs(decimalNumber)));
    const multiplier = Math.pow(10, significantFigures - 1 - exponent);

    const roundedNumber = Math.round(decimalNumber * multiplier) / multiplier;

    // Convert the result to decimal representation
    return roundedNumber.toFixed(significantFigures);
  }
  async convertNgntoUsd(xNgn: string) {
    if (xNgn === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=USD&convert=NGN",
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const usd = parseInt(xNgn) / Math.round(response.data.data.quote.NGN.price);
    console.log(response.data.data.quote.NGN.price);

    const roundedUsd = this.roundToSignificantFigures(usd, 9);
    return roundedUsd.toString();
  }

  async convertUsdtoNgn(xUsd: string) {
    if (xUsd === "0") {
      return "0";
    }
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      `https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=${xUsd}&symbol=USD&convert=NGN`,
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const ngn = response.data.data.quote.NGN.price;
    return ngn;
  }

  async getGonaTokenBalance(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException("Invalid Token");
      }
      const balance = await this.ccdService.cis2BalanceOf(
        user.ccd_wallet_address,
        gonaAdminToken,
      );
      user.gonaTokenBalance = balance;
      await user.save();
      return {
        success: true,
        balance: balance,
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.reason || error.message,
        },
        400,
      );
    }
  }

  async transferGonaToken(id: string, amount: number, recipientWallet: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException("Invalid Token");
      }

      const query = await this.getGonaTokenBalance(id);
      if (query.balance < amount) {
        throw new BadRequestException("Insufficient Gona Token Balance");
      }
      const recipient = await this.userModel.findOne({
        ccd_wallet_address: recipientWallet,
      });
      if (recipient) {
        await this.ccdService.transferCis2Token(
          amount,
          recipient.ccd_wallet_address,
          id,
          gonaAdminToken,
        );
        const debitMessage = {
          app_id: process.env.ONESIGNAL_APP_ID,
          contents: {
            en: `${amount} gona has been debited from your wallet`,
          },
          headings: {en: "Debit Notification"},
          included_segments: ["include_player_ids"],
          include_player_ids: [user.onesignal_id],
          content_available: true,
          small_icon:
            "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
        };
        await this.sendNotificationToDevice(debitMessage, user.id);
        const creditMessage = {
          app_id: process.env.ONESIGNAL_APP_ID,
          contents: {
            en: `${amount} gona has been credited into your wallet`,
          },
          headings: {en: "Credit Notification"},
          included_segments: ["include_player_ids"],
          include_player_ids: [recipient.onesignal_id],
          content_available: true,
          small_icon:
            "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
        };

        await this.sendNotificationToDevice(
          creditMessage,
          recipient.onesignal_id,
        );

        return {
          success: true,
          message: "Transfer completed",
        };
      }
      const transfer = await this.ccdService.transferCis2Token(
        amount,
        recipientWallet,
        id,
        gonaAdminToken,
      );
      if (!transfer) {
        throw new BadRequestException("Transfer failed");
      }
      const debitMessage = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {
          en: `${amount} gona has been debited from your wallet`,
        },
        headings: {en: "Debit Notification"},
        included_segments: ["include_player_ids"],
        include_player_ids: [user.onesignal_id],
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };
      await this.sendNotificationToDevice(debitMessage, user.id);

      return {
        success: true,
        message: "Transfer completed",
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.reason || error.message,
        },
        error.status || 400,
      );
    }
  }

  async withdrawGona(id: string, amount: number, recipientWallet: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException("Invalid Token");
      }

      const query = await this.getGonaTokenBalance(id);
      if (query.balance < amount) {
        throw new BadRequestException("Insufficient Gona Token Balance");
      }
      const transaction = await this.ccdService.withdrawCis2Token(
        amount,
        recipientWallet,
        id,
        gonaAdminToken,
      );
      if (!transaction) {
        throw new BadRequestException("Transaction Failed");
      }
      return {success: true, messsage: "Withdrawal Successful"};
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.reason || error.message,
        },
        error.status || 400,
      );
    }
  }

  async sendGona(id: string, amount: number, recipientWallet: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException("Invalid Token");
      }

      const query = await this.getGonaTokenBalance(id);
      if (query.balance < amount) {
        throw new BadRequestException("Insufficient Gona Token Balance");
      }
      if (recipientWallet.length === 64) {
        await this.transferGonaToken(id, amount, recipientWallet);
        return {success: true, message: "Transfer Successful"};
      }

      const isCcdWallet = new AccountAddress(recipientWallet);
      if (isCcdWallet) {
        const transaction = await this.withdrawGona(
          id,
          amount,
          recipientWallet,
        );
        if (!transaction) {
          throw new BadRequestException("Transaction Failed");
        }
        return {success: true, messsage: "Withdrawal Successful"};
      }
    } catch (error) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.reason || error.message,
        },
        error.status || 400,
      );
    }
  }

  async depositGona(id: string, amount: number) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new BadRequestException("Invalid Token");
      }
      console.log(amount);

      await this.ccdService.depositCis2Token(
        amount,
        id,
        {
          index: 9774n,
          subindex: 0n,
        },
        gonaModuleRef,
      );
      return {success: true, message: "Deposit Succesful"};
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.reason || error.message,
        },
        error.status || 400,
      );
    }
  }

  async sendEth(id: string, amount: string, toAddress: string) {
    try {
      const url = "https://sepolia-rollup.arbitrum.io/rpc";

      const provider = new providers.JsonRpcProvider(url);
      console.log("Provider connected:", provider.connection);
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found");
      }
      console.log(
        `${user.first_name} attempst send ${amount} eth to ${toAddress}`,
      );

      const privateKey = user.arbitrumPrivateKey;
      if (privateKey === undefined || privateKey.length < 1) {
        throw new BadRequestException(
          "You have not been assigned a private key. To get one check you crypto wallet balance",
        );
      }

      const wallet = new Wallet(privateKey, provider);
      console.log("wallet gotten");
      // Validate the toAddress
      if (!utils.isAddress(toAddress)) {
        throw new BadRequestException("Invalid Ethereum address");
      }
      console.log("Adress valid");

      // Convert amount to Wei (1 Ether = 1e18 Wei)
      const amountWei = utils.parseEther(amount);
      console.log("wei converted");
      // Create a transaction
      const transaction = {
        to: toAddress,
        value: amountWei,
      };

      // Send the transaction
      const tx = await wallet.sendTransaction(transaction);
      // Wait for the transaction to be mined
      const op = await tx.wait();
      console.log(op);
      console.log(`Successfully transferred ${amount} Ether to ${toAddress}`);
      return {
        success: true,
        message: `Successfully transferred ${amount} Ether to ${toAddress}`,
      };
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.reason || error.message,
        },
        400,
      );
    }
  }

  async sendNotification() {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Basic " + process.env.ONESIGNAL_API_KEY,
    };
    const message = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {en: "Test push notification"},
      included_segments: ["All"],
      content_available: true,
      small_icon: "ic_notification_icon",
      data: {
        PushTitle: "CUSTOM NOTIFICATION",
      },
    };

    const url = "https://onesignal.com/api/v1/notifications";
    const req = await axios.post(url, message, {headers: headers});

    return req.data;
  }

  async sendNotificationToDevice(message: any, userId: string) {
    const headers = {
      "Content-Type": "application/json",
      Authorization: "Basic " + process.env.ONESIGNAL_API_KEY,
    };

    const url = "https://onesignal.com/api/v1/notifications";
    const req = await axios.post(url, message, {headers: headers});
    const notificationExists = await this.notificationModel.findOne({
      userId: userId,
    });
    console.log(message.contents.en);
    if (notificationExists) {
      console.log("here");

      notificationExists.notification.push({body: message.contents.en});
      await notificationExists.save();
      return;
    }
    await this.notificationModel.create({
      userId: userId,
      notification: [{body: message.contents.en}],
    });

    console.log(req.data);
    return req.data;
  }
  async sendTestNotificationToDevice(data: Array<string>) {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: "Basic " + process.env.ONESIGNAL_API_KEY,
      };
      console.log(data);

      const message = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {en: "Test push notification"},
        headings: {en: "Test😃"},
        included_segments: ["include_player_ids"],
        include_player_ids: data,
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };

      const url = "https://onesignal.com/api/v1/notifications";
      const req = await axios.post(url, message, {headers: headers});
      console.log(req.status);
      return req.data;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.response.data.errors,
        },
        error.response.status,
      );
    }
  }

  async sendNotificationToDevices(body: string, title: string) {
    try {
      const headers = {
        "Content-Type": "application/json",
        Authorization: "Basic " + process.env.ONESIGNAL_API_KEY,
      };

      const message = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {en: body},
        headings: {en: title},
        included_segments: ["All"],
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };

      const url = "https://onesignal.com/api/v1/notifications";
      const req = await axios.post(url, message, {headers: headers});
      console.log(req.status);
      return req.data;
    } catch (error: any) {
      console.log(error);
      throw new HttpException(
        {
          success: false,
          message: error.response.data.errors,
        },
        error.response.status,
      );
    }
  }

  async transferCcd(amount: number, recipientWallet: string, id: string) {
    await this.getCcdWalletBalance(id);
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BadRequestException("Invalid Token");
    }
    if (parseFloat(user.ccd_wallet) < amount) {
      throw new BadRequestException("Insufficient ccd balance");
    }
    const recipient = await this.userModel.findOne({
      ccd_wallet_address: recipientWallet,
    });
    if (recipient) {
      await this.ccdService.transferCcd(
        amount,
        recipient.ccd_wallet_address,
        id,
      );
      const debitMessage = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {
          en: `${amount} ccd has been debited from your wallet`,
        },
        headings: {en: "Debit Notification"},
        included_segments: ["include_player_ids"],
        include_player_ids: [user.onesignal_id],
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };
      const transactionObject: Record<string, any> = {
        userId: user.id,
        Type: "DEBIT" as const,
        AmountSettled: amount,
        Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        recipientWallet: recipientWallet,
        currency: "CCD",
      };

      const transaction = await this.transactionModel.findOne({
        userId: user.id,
      });
      if (!transaction) {
        await this.transactionModel.create(transactionObject);
      }
      const transactionArrayObject = {
        currency: "CCD" as const,
        Type: "DEBIT" as const,
        AmountSettled: amount,
        AmountSent: amount,
        Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        recipientWallet,
      };
      console.log(transactionArrayObject, transactionArrayObject);
      transaction.transactions.push(transactionArrayObject);
      await transaction.save();
      await this.sendNotificationToDevice(debitMessage, user.id);
      const creditMessage = {
        app_id: process.env.ONESIGNAL_APP_ID,
        contents: {
          en: `${amount} ccd has been credited into your wallet`,
        },
        headings: {en: "Credit Notification"},
        included_segments: ["include_player_ids"],
        include_player_ids: [recipient.onesignal_id],
        content_available: true,
        small_icon:
          "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
      };

      await this.sendNotificationToDevice(
        creditMessage,
        recipient.onesignal_id,
      );

      return {
        success: true,
        message: "Transfer completed",
      };
    }
    const transfer = await this.ccdService.transferCcd(
      amount,
      recipientWallet,
      id,
    );
    if (!transfer) {
      throw new BadRequestException("Transfer failed");
    }
    const debitMessage = {
      app_id: process.env.ONESIGNAL_APP_ID,
      contents: {
        en: `${amount} ccd has been debited from your wallet`,
      },
      headings: {en: "Debit Notification"},
      included_segments: ["include_player_ids"],
      include_player_ids: [user.onesignal_id],
      content_available: true,
      small_icon:
        "https://res.cloudinary.com/du63jingj/image/upload/v1709077508/launcher_icon_evcy0u.png",
    };
    await this.sendNotificationToDevice(debitMessage, user.id);

    return {
      success: true,
      message: "Transfer completed",
    };
  }

  async airdropTokens() {
    const users = await this.userModel
      .find({
        ccd_wallet_address: {
          $type: "string",
          $ne: null,
        },
        $expr: {
          $gt: [{$strLenCP: "$ccd_wallet_address"}, 1], // Ensures the length is greater than 1
        },
        _id: {$nin: ["66b60b909b70117042ef83d0"]},
        airdropped: false,
      })
      .limit(30);
    const noOfUsers = users.length;
    const avalableTokens = await this.getGonaTokenBalance(
      "66b60b909b70117042ef83d0",
    );

    if (avalableTokens.balance <= 0) {
      console.error("Insufficient tokens");
      return;
    }

    const distributionArray = await this.distributeTokens(
      avalableTokens.balance,
      noOfUsers,
      700,
      1050,
    );
    console.log(distributionArray);
    const recipientArray = [];
    for (let i = 0; i < users.length; i++) {
      if (users[i].airdropped === false) {
        console.log(distributionArray[i]);
        recipientArray.push({
          to: users[i].ccd_wallet_address,
          transfer_amount: {
            token_amount: (distributionArray[i] * 10 ** 6).toString(),
            token_id: "",
            cis2_token_contract_address: gonaAdminToken,
          },
        });
        console.log(
          `Built recipient ${distributionArray[i]} token to ${users[i].email}`,
        );
        users[i].airdropped = true;
        await users[i].save();
      }
    }
    await this.ccdService.batchTransferCis2Token(
      recipientArray,
      "66b60b909b70117042ef83d0",
      gonaAdminToken,
    );

    return;
  }
  coinFlip() {
    return Math.random() < 0.5 ? "Buy" : "Sell";
  }

  // async simulateBuy() {
  //   const products = await this.postModel.find({type: "product"});

  //   const farmerIds = products.map(product => {
  //     return product.publisher_id;
  //   });

  //   const usersA = await this.userModel
  //     .find({
  //       ccd_wallet_address: {
  //         $type: "string",
  //         $ne: null,
  //       },
  //       $expr: {
  //         $gt: [{$strLenCP: "$ccd_wallet_address"}, 1], // Ensures the length is greater than 1
  //       },
  //       _id: {$nin: ["66b60b909b70117042ef83d0", ...farmerIds]},
  //       //airdropped: true,
  //     })
  //     .limit(50);
  //   const users = shuffleArray(usersA);
  //   const shuffledProducts = shuffleArray(products);
  //   for (let i = 0; i < users.length; i++) {
  //     const adminId = "66b60b909b70117042ef83d0";
  //     const adminBalance = await this.ccdService.ccdBalanceOf(adminId);

  //     const userBalance = await this.ccdService.ccdBalanceOf(users[i].id);
  //     const farmer = await this.userModel.findById(
  //       shuffledProducts[i].publisher_id,
  //     );
  //     if (userBalance < shuffledProducts[i].ccd_price) {
  //       const amountToSend = shuffledProducts[0].amount - userBalance + 1;
  //       await this.ccdService.transferCcd(
  //         amountToSend,
  //         users[i].ccd_wallet_address,
  //         adminId,
  //       );
  //     }
  //     const transactionId = this.generateRandomString(5);
  //     await this.ccdService.pay(
  //       shuffledProducts[i].amount,
  //       farmer.ccd_wallet_address,
  //       adminId,
  //       transactionId,
  //     );
  //     await this.farmerModel.create({
  //       farmerId: farmer.id,
  //       customerId: users[i].id,
  //       productId: shuffledProducts[i].id,
  //       transactionId: transactionId,
  //     });
  //   }
  //   const action = this.coinFlip();
  //   if (action === "Sell") {
  //     console.log("Its a sell");
  //     const transactions = await this.farmerModel.find();
  //     const newTransactions = shuffleArray(transactions);
  //     const iterations = Math.min(newTransactions.length, 4);

  //     for (let i = 0; i < iterations; i++) {
  //       // Generate a random delay between 0 ms and 5 minutes (300,000 ms)
  //       const delay = Math.floor(Math.random() * (300000 + 1));
  //       console.log(
  //         `Escrow will be released to ${newTransactions[i].farmerId} in ${delay}ms`,
  //       );
  //       setTimeout(async () => {
  //         await this.ccdService.withdrawFromEscrow(
  //           newTransactions[i].transactionId,
  //         );
  //       }, delay);
  //     }
  //   }
  //   if (action === "Buy") {
  //     console.log("Its a buy");
  //     for (let i = 0; i < 4; i++) {
  //       const adminId = "66b60b909b70117042ef83d0";
  //       const adminBalance = await this.ccdService.ccdBalanceOf(adminId);

  //       if (adminBalance < 200) {
  //         throw new BadRequestException("Insufficient Balance");
  //       }

  //       const userBalance = await this.ccdService.ccdBalanceOf(users[i].id);
  //       const farmer = await this.userModel.findById(
  //         shuffledProducts[i].publisher_id,
  //       );

  //       if (userBalance < shuffledProducts[i].ccd_price) {
  //         console.log(`Not enough balance  sending to ${users[i].balance}`);
  //         const amountToSend = shuffledProducts[i].amount - userBalance + 1;

  //         // Generate random delay between 0 and 5 minutes for transfer
  //         const transferDelay = Math.floor(Math.random() * (300000 + 1));

  //         setTimeout(async () => {
  //           await this.ccdService.transferCcd(
  //             amountToSend,
  //             users[i].ccd_wallet_address,
  //             adminId,
  //           );
  //         }, transferDelay);
  //       }

  //       // Generate random delay between 0 and 5 minutes for pay
  //       const payDelay = Math.floor(Math.random() * (300000 + 1));

  //       setTimeout(async () => {
  //         const transactionId = this.generateRandomString(5);
  //         await this.ccdService.pay(
  //           shuffledProducts[i].amount,
  //           farmer.ccd_wallet_address,
  //           adminId,
  //           transactionId,
  //         );
  //         await this.farmerModel.create({
  //           farmerId: farmer.id,
  //           customerId: users[i].id,
  //           productId: shuffledProducts[i].id,
  //           transactionId: transactionId,
  //         });
  //       }, payDelay);
  //     }
  //   }
  // }

  async distributeTokens(
    totalTokens: number,
    usersCount: number,
    minTokens: number,
    maxTokens: number,
  ): Promise<number[]> {
    // Input validation
    if (
      totalTokens < 0 ||
      usersCount <= 0 ||
      minTokens < 0 ||
      maxTokens < minTokens
    ) {
      throw new Error("Invalid input parameters");
    }

    if (minTokens * usersCount > totalTokens) {
      throw new Error(
        "Cannot satisfy minimum distribution constraints. " +
          `Total tokens must be at least ${minTokens * usersCount}`,
      );
    }

    const allocations: number[] = new Array(usersCount).fill(0);

    for (let i = 0; i < usersCount; i++) {
      allocations[i] = minTokens;
    }

    for (let i = 0; i < usersCount; i++) {
      const space = maxTokens - allocations[i];
      const randomAmount = Math.floor(Math.random() * space) + 1;
      allocations[i] += randomAmount;
    }

    return allocations;
  }

  async withdrawCcd(amount: number, recipient: string, id: string) {
    await this.getCcdWalletBalance(id);
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BadRequestException("Invalid Token");
    }

    if (parseFloat(user.ccd_wallet) < amount) {
      throw new BadRequestException("Insufficient ccd balance");
    }
    const withdraw = await this.ccdService.withdrawCcd(amount, recipient, id);
    if (!withdraw) {
      throw new BadRequestException("Withdraw failed");
    }
    const transactionObject: Record<string, any> = {
      userId: user.id,
      Type: "DEBIT" as const,
      AmountSettled: amount,
      Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      recipientWallet: "ADMIN",
      currency: "CCD",
    };

    const transaction = await this.transactionModel.findOne({
      userId: user.id,
    });
    if (!transaction) {
      await this.transactionModel.create(transactionObject);
    }
    const transactionArrayObject = {
      currency: "CCD" as const,
      Type: "DEBIT" as const,
      AmountSettled: amount,
      AmountSent: amount,
      Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      recipientWallet: "ADMIN",
    };
    console.log(transactionArrayObject, transactionArrayObject);
    transaction.transactions.push(transactionArrayObject);
    await transaction.save();
    return {
      success: true,
      message: "Withdrawal completed",
    };
  }

  async isPlayerIdValid(playerId: string): Promise<boolean> {
    const config = {
      headers: {
        host: "onesignal.com",
      },
    };

    const url = `https://onesignal.com/api/v1/players/${playerId}?app_id=${process.env.ONESIGNAL_APP_ID}`;

    try {
      const response = await axios.get(url, config);

      return !response.data.invalid_identifier;
    } catch (error: any) {
      if (error.response && error.response.data.errors) {
        return false;
      }
      throw new HttpException(
        {
          success: false,
          message: error.response.data.errors,
        },
        error.response.status,
      );
    }
  }

  async updateOneSignalId(userId: string, oneSignalId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    if (!oneSignalId) {
      throw new BadRequestException("Must provide oneSignalId");
    }
    user.onesignal_id = oneSignalId;
    await user.save();
    return {success: true, message: "One signal Id updated"};
  }

  async getNotifications(userId: string) {
    if (!userId) {
      throw new BadRequestException({
        success: false,
        message: "User not found",
      });
    }
    const notifications = await this.notificationModel.findOne({
      userId: userId,
    });
    if (!notifications) {
      throw new BadRequestException({
        success: false,
        message: "Notifications not found",
      });
    }
    if (notifications.notification.length < 1) {
      throw new BadRequestException({
        success: false,
        message: "User does not have any notifications",
      });
    }
    return {
      success: true,
      data: notifications.notification,
    };
  }
  async getByReferralCode(code: string) {
    const user = await this.userModel.findOne({
      referral_code: {$regex: new RegExp(`^${code}$`, "i")}, // Case-insensitive match
    });

    return user;
  }
  generateRandomString(length = 6) {
    const characters =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    let i = 0;

    while (i < length) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
      i++;
    }

    return result;
  }
  async generateUniqueReferralCode() {
    let code: string;
    let isUnique = false;

    while (!isUnique) {
      // Step 1: Generate a new referral code
      code = this.generateRandomString();

      // Step 2: Check if the code exists in the database
      const existingUser = await this.getByReferralCode(code);

      if (!existingUser) {
        isUnique = true; // If no user with this referral code exists, it's unique
      }
    }

    return code;
  }
  async getUsersIreferred(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException("Invalid Token");
    }

    const referredUsers = await this.userModel.find(
      {
        _id: {$in: user.referredUsers}, // Find users whose IDs are in referredUserIds
      },
      {id: 1, first_name: 1, last_name: 1, profile_photo: 1, cover_photo: 1},
    );
    return {success: true, data: referredUsers};
  }
}
