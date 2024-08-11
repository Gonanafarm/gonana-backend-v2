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
      const updatedUser = await this.updateItem(id, details);
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
      // const url = "https://sepolia-rollup.arbitrum.io/rpc";
      // const provider = new providers.JsonRpcProvider(url);
      if (!user) {
        return null;
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
        await user.save();
      }

      if (user.wallet_address === undefined || user.wallet_address === null) {
        const wallet = await this.ccdService.getOrCreateConcordiumKeyPairs(id);
        const address = wallet.publicKey;
        const balance = await this.ccdService.ccdBalanceOf(id);
        const privateKey = wallet.privateKey;

        user.wallet = balance.toString();
        user.wallet_address = address;
        user.privateKey = privateKey;
        await user.save();
      }
      const userData = user?.getPublicData();

      if (userData) {
        user.cryptoWalletBalanceInNgn = await this.convertCcdtoNgn(user.wallet);
        console.log(user.cryptoWalletBalanceInNgn);

        await user.save();
      }
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
    console.log(user);

    return this.getUserData(user.id);
  }

  async generateTokenByEmail(email: string) {
    const user = await this.userModel.findOne({email: email});

    if (!user) {
      throw new NotFoundException("User not found");
    }
    console.log(user);
    const token = this.jwtService.sign(
      {...user.getPublicData()},
      {subject: `${user.id}`},
    );
    return {user: user.getPublicData(), token: token};
  }

  async generateToken() {
    try {
      const base_url = process.env.MINTYN_BASE_URL;
      const id = process.env.MERCHANT_ID;
      const secret = process.env.MINTYN_SECRET;
      const tokenUrl = `${base_url}/api/v1/authorization/generate-token/${id}`;
      const tokenHeaders = {
        "secret-key": secret,
      };

      const response = await axios.get(tokenUrl, {headers: tokenHeaders});

      if (!response.data.data.token) {
        throw new InternalServerErrorException(response.data.message);
      }
      const token = response.data.data.token;
      return token;
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
  //     await user.save();

  //     user.virtual_account_number = createAccount.data.data.accountNumber;
  //     await user.save();

  //     user.virtual_account_bank_name = createAccount.data.data.bankName;
  //     await user.save();

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

  async virtualAccount(userId: string) {
    try {
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException("Login and try again");
      }
      if (!user.fiat_wallet_address) {
        throw new BadRequestException("Login and try again");
      }
      const toroData = {
        op: "generatevirtualwallet",
        params: [
          {
            name: "address",
            value: `${user.fiat_wallet_address}`, //wallet address
          },
          {
            name: "payername",
            value: `${user.first_name} ${user.last_name}`, //name of the account holder
          },
          {
            name: "currency",
            value: "NGN", //current options are USD, EUR, NGN - default
          },
        ],
      };
      const baseUrl = process.env.TORONET_BASE_URL;

      const toronetRequest = await axios.post(
        `${baseUrl}/payment/toro/`,
        toroData,
        {headers: toronetHeaders},
      );
      if (toronetRequest.data.result === false) {
        throw new BadRequestException(toronetRequest.data.error);
      }

      user.virtual_account_bank_name = toronetRequest.data.bankname;
      user.virtual_account_name = toronetRequest.data.accountname;
      user.virtual_account_number = toronetRequest.data.accountnumber;
      await user.save();
      return toronetRequest.data;
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

  async transferToEscrowFromUser(amount: string, userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user)
      throw new BadRequestException("Login and try again, Invalid token");

    const resolve = await this.resolveAccountNumber(
      gonanaAccountNumber,
      gonanaAccountBankName,
    );
    const accountName = resolve.data.data.accountName;
    const narration = "order credit";
    const data = {
      op: "recordfiatwithdrawal",
      params: [
        {
          name: "addr",
          value: user.fiat_wallet_address,
        },
        {
          name: "pwd",
          value: user.email,
        },
        {
          name: "currency",
          value: "NGN",
        },
        {
          name: "token",
          value: "NGN",
        },
        {
          name: "payername",
          value: `${user.first_name} ${user.last_name}`,
        },
        {
          name: "payeremail",
          value: user.email,
        },
        {
          name: "payeraddress",
          value: "nil",
        },
        {
          name: "payercity",
          value: "nil",
        },
        {
          name: "payerstate",
          value: "nil",
        },
        {
          name: "payercountry",
          value: "NG",
        },
        {
          name: "payerzipcode",
          value: "nil",
        },
        {
          name: "payerphone",
          value: user.phone,
        },
        {
          name: "description",
          value: narration,
        },
        {
          name: "amount",
          value: amount.toString(),
        },
        {
          name: "accounttype",
          value: "ach",
        },
        {
          name: "bankname",
          value: gonanaAccountBankName,
        },
        {
          name: "routingno",
          value: "nil",
        },
        {
          name: "accountno",
          value: gonanaAccountNumber,
        },
        {
          name: "expirydate",
          value: "nil",
        },
        {
          name: "accountname",
          value: accountName,
        },
        {
          name: "recipientstate",
          value: "nil",
        },
        {
          name: "recipientzip",
          value: "nil",
        },
        {
          name: "recipientphone",
          value: "nil",
        },
      ],
    };

    console.log(data);

    const res = await axios.post(`${toronetBaseUrl}/payment/toro/`, data, {
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
    const resolve = await this.resolveAccountNumber(
      user.virtual_account_number,
      user.virtual_account_bank_name,
    );
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

    const accountName = resolve.data.data.accountName;
    const narration = "Order Settlement from Gonana";
    const data = {
      op: "recordfiatwithdrawal",
      params: [
        {
          name: "addr",
          value: gonanaAdminAddress,
        },
        {
          name: "pwd",
          value: gonanaAdminPassword,
        },
        {
          name: "currency",
          value: "NGN",
        },
        {
          name: "token",
          value: "NGN",
        },
        {
          name: "payername",
          value: gonanaAccountName,
        },
        {
          name: "payeremail",
          value: gonanaAdminPassword,
        },
        {
          name: "payeraddress",
          value: "nil",
        },
        {
          name: "payercity",
          value: "nil",
        },
        {
          name: "payerstate",
          value: "nil",
        },
        {
          name: "payercountry",
          value: "NG",
        },
        {
          name: "payerzipcode",
          value: "nil",
        },
        {
          name: "payerphone",
          value: gonanaAdminPhoneNumber,
        },
        {
          name: "description",
          value: narration,
        },
        {
          name: "amount",
          value: amount.toString(),
        },
        {
          name: "accounttype",
          value: "ach",
        },
        {
          name: "bankname",
          value: user.virtual_account_bank_name,
        },
        {
          name: "routingno",
          value: "nil",
        },
        {
          name: "accountno",
          value: user.virtual_account_number,
        },
        {
          name: "expirydate",
          value: "nil",
        },
        {
          name: "accountname",
          value: accountName,
        },
        {
          name: "recipientstate",
          value: "nil",
        },
        {
          name: "recipientzip",
          value: "nil",
        },
        {
          name: "recipientphone",
          value: "nil",
        },
      ],
    };

    console.log(data);

    const res = await axios.post(`${toronetBaseUrl}/payment/toro/`, data, {
      headers: toronetHeaders,
    });
    console.log(res.data);
    if (res.data.result !== true) {
      throw new BadRequestException(res.data.error);
    }
    return res.data;
  }

  async verifyTransaction(data: any) {
    console.log(data);

    const user = await this.userModel.findOne({bvn: data.payload.customerBVN});
    if (!user) {
      console.log("email not sent");
      return {success: false, message: "Email not sent"};
    }
    const session_id = data.payload.sessionId;

    const email = user.email;
    try {
      this.userMailer.transactionVerification(
        email,
        data.eventType,
        data.payload.transactionAmount,
      );

      setTimeout(() => {
        this.confirmTransaction(session_id, email);
      }, 300000);
      return {success: true, message: `Notification sent to ${email}`};
    } catch (error: any) {
      console.error(error);
      return {success: false, error: error.message};
    }
  }
  async confirmTransaction(session_id: string, email: string) {
    try {
      const user = await this.userModel.findOne({email: email});
      if (!user) {
        console.log("User not found");
        return;
      }
      const token = await this.generateToken();
      const Headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const base_url = process.env.MINTYN_BASE_URL;
      const url = `${base_url}/api/v1/merchant/virtual-account/verify-transaction?sessionId=${session_id}`;
      const res = await axios.get(url, {headers: Headers});

      if (res.data.data.settlementStatus !== "SETTLED") {
        console.log(res.data.data);
        console.log(
          `Transaction with sessionId:${session_id} is still pending`,
        );
        const transactionObject = {
          userId: user.id,
          Session_id: session_id,
          Type: "PENDING" as const,
          AmountSent: res.data.data.transactionAmount,
          AmountSettled: res.data.data.amountSettled,
          Time: res.data.data.transactionTime,
        };
        const transactions = await this.transactionModel.findOne({
          userId: user.id,
        });

        if (!transactions) {
          transactionObject.userId = user.id;
          const transaction = await this.transactionModel.create(
            transactionObject,
          );
          transaction.transactions.push(transactionObject);
          await transaction.save();
          return;
        }

        transactions.transactions.push(transactionObject);
        await transactions.save();
        return;
      }

      const transactionObject = {
        userId: user.id,
        Session_id: session_id,
        Type: "CREDIT",
        AmountSent: res.data.data.transactionAmount,
        AmountSettled: res.data.data.amountSettled,
        Time: res.data.data.transactionTime,
      };

      // Handle updating the user balance and saving the transaction asynchronously
      await this.updateUserBalanceAndSaveTransaction(user, transactionObject);

      const transactionAmount = transactionObject.AmountSettled;
      this.userMailer.transactionSucess(email, transactionAmount);

      return true;
    } catch (error) {
      console.error(error);
      return;
    }
  }

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
      const base_url = process.env.TORONET_BASE_URL;
      const url = `${base_url}/payment/toro/`;
      const toroData = {
        op: "getbanklist_ngn",
        params: [],
      };
      const response = await axios.post(url, toroData);
      const banks = response.data.data;
      return {success: true, data: banks};
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
    try {
      const banks = (await this.getBanks()).data;
      const bank = banks.find(
        (bank: any) =>
          bank.bankName.toLowerCase() === bank_name.toLowerCase() ||
          bank.bankShortName.toLowerCase() === bank_name.toLowerCase(),
      );
      if (!bank) {
        throw new NotFoundException("Bank Not Found");
      }
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
  }

  async recoverVirtualAccount(bvn: string, userId: string) {
    try {
      const token = await this.generateToken();
      if (!token) {
        throw new InternalServerErrorException("Failed To Get Token");
      }
      const accountHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const user = await this.userModel.findById(userId);

      if (!user) {
        throw new NotFoundException(`User Not Found, Login and try again`);
      }

      if (user.bvn !== undefined) {
        `You have already generated a virtual account`;
      }

      if (bvn.length !== 11) {
        throw new BadRequestException("Bvn should be 11 digits");
      }
      const bvnExists = await this.userModel.findOne({bvn: bvn});

      if (bvnExists?.id === userId) {
        throw new BadRequestException(
          `You have already generated a virtual account`,
        );
      }

      if (bvnExists) {
        throw new ConflictException(`Gonana user with this bvn exists`);
      }

      const base_url = process.env.MINTYN_BASE_URL;

      const url = `${base_url}/api/v1/merchant/virtual-account/accounts?bvn=${bvn}&page=0&size=100`;
      const response = await axios.get(url, {headers: accountHeaders});
      if (response.data.data.records.length < 1) {
        throw new BadRequestException("Bvn not previously validated");
      }
      user.virtual_account_bank_name = response.data.data.records[0].bankName;
      user.bvn = response.data.data.records[0].bvn;
      user.virtual_account_name = response.data.data.records[0].accountName;
      user.virtual_account_number = response.data.data.records[0].accountNumber;
      await user.save();
      return {
        success: true,
        message: "Virtual Account Recovered",
        accountDetails: {
          accountNumber: user.virtual_account_number,
          accountName: user.virtual_account_name,
          bankName: user.virtual_account_bank_name,
        },
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

  async resolveAccountNumber(account_number: string, bank: string) {
    try {
      const bankCode = await this.getBankCode(bank);
      console.log(bankCode);
      const toroData = {
        op: "verifybankaccountname_ngn",
        params: [
          {
            name: "destinationInstitutionCode",
            value: bankCode, //destinationInstitutionCode
          },
          {
            name: "accountNumber",
            value: account_number,
          },
        ],
      };
      const base_url = process.env.TORONET_BASE_URL;
      const url = `${base_url}/payment/toro/`;
      const response = await axios.post(url, toroData, {
        headers: toronetHeaders,
      });
      if (response.data.data === null) {
        throw new HttpException(
          {
            success: false,
            message: response.data.responseMessage,
          },
          400,
        );
      }
      console.log(response.data.data.accountName);

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
  }

  async getUserBalance(id: string) {
    try {
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found, Login and Try again.");
      }

      if (!user.fiat_wallet_address || user.fiat_wallet_address.length < 1) {
        throw new BadRequestException("Login and try again");
      }
      const toroData = {
        op: "updatevirtualwallettransactions",
        params: [
          {
            name: "walletaddress",
            value: user.virtual_account_number, //blockchain address
          },
        ],
      };
      await axios.post(`${toronetBaseUrl}/payment`, toroData, {
        headers: toronetHeaders,
      });
      const response = await axios.get(`${toronetBaseUrl}/query`, {
        params: {
          op: "getaddrbalance",
          params: [
            {
              name: "addr",
              value: `${user.fiat_wallet_address}`,
            },
          ],
        },
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.result !== true || response.data.result === undefined) {
        throw new BadRequestException(response.data.error);
      }
      const balance = response.data.bal_naira;
      console.log(balance);

      user.balance = parseFloat(parseFloat(balance).toFixed(2));

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

  async transfer(
    user_id: string,
    accountNumber: string,
    bankName: string,
    amount: number,
    account_name: string,
    narration?: string,
  ) {
    try {
      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new NotFoundException("user not found. login and try again");
      }
      //@ts-ignore
      const balance = parseInt(user.balance);
      console.log(balance);

      if (balance < amount) {
        throw new BadRequestException("Insuffient balance");
      }
      const resolve = await this.resolveAccountNumber(accountNumber, bankName);
      const bankCode = resolve.bankCode;

      const data = {
        op: "recordfiatwithdrawal",
        params: [
          {
            name: "addr",
            value: user.fiat_wallet_address,
          },
          {
            name: "pwd",
            value: user.email,
          },
          {
            name: "currency",
            value: "NGN",
          },
          {
            name: "token",
            value: "NGN",
          },
          {
            name: "payername",
            value: `${user.first_name} ${user.last_name}`,
          },
          {
            name: "payeremail",
            value: user.email,
          },
          {
            name: "payeraddress",
            value: "nil",
          },
          {
            name: "payercity",
            value: "nil",
          },
          {
            name: "payerstate",
            value: "nil",
          },
          {
            name: "payercountry",
            value: "NG",
          },
          {
            name: "payerzipcode",
            value: "nil",
          },
          {
            name: "payerphone",
            value: user.phone,
          },
          {
            name: "description",
            value: narration,
          },
          {
            name: "amount",
            value: amount.toString(),
          },
          {
            name: "accounttype",
            value: "ach",
          },
          {
            name: "bankname",
            value: bankName,
          },
          {
            name: "routingno",
            value: "nil",
          },
          {
            name: "accountno",
            value: accountNumber,
          },
          {
            name: "expirydate",
            value: "nil",
          },
          {
            name: "accountname",
            value: account_name,
          },
          {
            name: "recipientstate",
            value: "nil",
          },
          {
            name: "recipientzip",
            value: "nil",
          },
          {
            name: "recipientphone",
            value: "nil",
          },
        ],
      };

      console.log(data);

      const res = await axios.post(`${toronetBaseUrl}/payment/toro/`, data, {
        headers: toronetHeaders,
      });
      console.log(res.data);
      if (res.data.result !== true) {
        throw new BadRequestException(res.data.error);
      }

      const transactionObject: Record<string, any> = {
        Session_id: res.data.data.data.sessionID,
        userId: user.id,
        Type: "DEBIT" as const,
        AmountSettled: res.data.data.data.amount,
        Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toLocaleString(),
      };

      if (narration !== undefined) {
        transactionObject.narration = narration;
      }
      const transaction = await this.transactionModel.findOne({
        userId: user.id,
      });
      if (!transaction) {
        await this.transactionModel.create(transactionObject);
        return {success: true, data: res.data};
      }
      const transactionArrayObject = {
        Session_id: res.data.data.data.sessionID,
        Type: "DEBIT" as const,
        AmountSettled: res.data.data.data.amount,
        AmountSent: res.data.data.data.amount,
        Time: new Date(Date.now() + 1 * 60 * 60 * 1000).toLocaleString(),
      };
      console.log(transactionArrayObject);
      transaction.transactions.push(transactionArrayObject);
      await transaction.save();

      return {success: true, data: res.data.data.data};
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

  async transferToUser(
    user_id: string,
    email: string,
    amount: number,
    narration?: string,
  ) {
    try {
      const user = await this.getByEmail(email);
      if (!user) {
        throw new BadRequestException("User Not Found");
      }
      const res = await this.transfer(
        user_id,
        user.virtual_account_number,
        user.virtual_account_bank_name,
        amount,
        user.virtual_account_name,
        narration,
      );
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
  async getCryptoWalletBalance(id: string) {
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

      if (user.wallet_address === undefined || user.wallet_address === null) {
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
        user.wallet = balance.toString();
        const ngn = await this.convertCcdtoNgn(user.wallet);
        return {
          success: true,
          cryptoWalletBalanceInNgn: ngn.toString(),
          cryptoWalletBalanceInCcd: user.wallet,
        };
      }
      const balance = await this.ccdService.ccdBalanceOf(id);

      user.wallet = balance.toString();

      const ngn = await this.convertCcdtoNgn(user.wallet);
      const usd = await this.convertNgntoUsd(ngn);
      user.cryptoWalletBalanceInNgn = ngn;
      user.cryptoWalletBalanceInUsd = usd;
      await user.save();
      return {
        success: true,
        cryptoWalletBalanceInNgn: ngn.toString(),
        cryptoWalletBalanceInCcd: user.wallet,
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
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=ETH&convert=NGN",
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const eth = parseInt(xNgn) / Math.round(response.data.data.quote.NGN.price);
    const roundedEth = this.roundToSignificantFigures(eth, 9);
    return roundedEth.toString();
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
  async payWithCCd(amount: number, recipientId: string, userId: string) {
    try {
      if (recipientId === userId) {
        throw new BadRequestException("You cannot transfer CCD to yourself");
      }
      const user = await this.userModel.findById(userId);
      if (!user) {
        throw new BadRequestException("Invalid Token");
      }
      const recipient = await this.userModel.findById(recipientId);
      if (!recipient) {
        throw new BadRequestException("Recipient not found");
      }
      if (!recipient.wallet_address) {
        throw new BadRequestException(
          "Recipient does not have a wallet address",
        );
      }
      await this.ccdService.pay(amount, recipient.wallet_address, userId);
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status || 500,
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

  async sendEth(id: string, amount: string, toAddress: string) {
    try {
      const url = "https://sepolia-rollup.arbitrum.io/rpc";
      const provider = new providers.JsonRpcProvider(url);

      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException("User not found");
      }

      const privateKey = user.privateKey;
      if (privateKey === undefined || privateKey.length < 1) {
        throw new BadRequestException(
          "You have not been assigned a private key. To get one check you crypto wallet balance",
        );
      }

      const wallet = new Wallet(privateKey, provider);

      // Validate the toAddress
      if (!utils.isAddress(toAddress)) {
        throw new BadRequestException("Invalid Ethereum address");
      }

      // Convert amount to Wei (1 Ether = 1e18 Wei)
      const amountWei = utils.parseEther(amount);

      // Create a transaction
      const transaction = {
        to: toAddress,
        value: amountWei,
      };

      // Send the transaction
      const tx = await wallet.sendTransaction(transaction);
      // Wait for the transaction to be mined
      await tx.wait();

      console.log(`Successfully transferred ${amount} Ether to ${toAddress}`);
      return {
        success: true,
        message: `Successfully transferred ${amount} Ether to ${toAddress}`,
      };
    } catch (error: any) {
      console.log(error);
      showObjectProperties(error);
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

  async transferCcd(amount: number, recipientId: string, id: string) {
    if (recipientId === id) {
      throw new BadRequestException("You cannot transfer CCD to yourself");
    }
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BadRequestException("Invalid Token");
    }
    const recipient = await this.userModel.findById(recipientId);
    if (!recipient) {
      throw new BadRequestException("Recipient not found");
    }
    if (!recipient.wallet_address) {
      throw new BadRequestException("Recipient does not have a wallet address");
    }

    const transfer = await this.ccdService.transferCcd(
      amount,
      recipient.wallet_address,
      id,
    );
    if (!transfer) {
      throw new BadRequestException("Transfer failed");
    }
    return {
      success: true,
      message: "Transfer completed",
    };
  }

  async withdrawCcd(amount: number, recipient: string, id: string) {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BadRequestException("Invalid Token");
    }
    const withdraw = await this.ccdService.withdrawCcd(amount, recipient, id);
    if (!withdraw) {
      throw new BadRequestException("Withdraw failed");
    }
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
}
