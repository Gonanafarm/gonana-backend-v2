import {Model} from "mongoose";
import * as mongoose from "mongoose";
import {v4 as uuid} from "uuid";
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  ConflictException,
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
  NumberAlreadyUsedException,
  BvnAlreadyUsedException,
} from "../common/exceptions";
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
import {providers, Wallet, utils} from "ethers";
@Injectable()
export class UserService extends GenericService<UserDocument> {
  constructor(
    //@ts-ignore
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel("Transactions")
    private readonly transactionModel: Model<TransactionDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
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
      const posts = await this.postModel.find({publisher_id: id});
      const postIds = posts.map((post: any) => {
        return post.id;
      });

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
    const user = await this.userModel.findById(id);
    return user?.getPublicData();
  }

  async getByEmail(email: string) {
    const user = await this.userModel.findOne({email: email});

    if (!user) {
      throw new NotFoundException("User not found");
    }
    console.log(user);

    return user.getPublicData();
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

  async virtualAccount(bvn: string, id: string) {
    const base_url = process.env.MINTYN_BASE_URL;
    try {
      const token = await this.generateToken();
      if (!token) {
        throw new InternalServerErrorException("Failed To Get Token");
      }
      const accountHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const user = await this.userModel.findById(id);
      if (!user) {
        throw new NotFoundException(`User Not Found, Login and try again`);
      }
      if (bvn.length !== 11) {
        throw new BadRequestException("Bvn should be 11 digits");
      }
      const bvnExists = await this.userModel.findOne({bvn: bvn});
      if (bvnExists && bvnExists.id !== user.id) {
        throw new ConflictException(`Gonana user with this bvn exists`);
      }
      const data = {
        customerFirstName: `${user.first_name} ${user.last_name}`,
        customerBVN: bvn,
      };

      const accountUrl = `${base_url}/api/v1/merchant/virtual-account/reserved-account`;
      const createAccount = await axios.post(accountUrl, data, {
        headers: accountHeaders,
      });

      console.log(createAccount.data);
      if (createAccount.data.data === null) {
        console.log(createAccount.data);
        this.userMailer.sendBvnVerificationFailedMail(
          user.email,
          `${createAccount.data.responseMessage}. Login again and check your verification status`,
        );
        throw new HttpException(
          {
            success: false,
            message: createAccount.data.responseMessage,
          },
          400,
        );
      }
      user.bvn = bvn;
      await user.save();

      user.virtual_account_number = createAccount.data.data.accountNumber;
      await user.save();

      user.virtual_account_bank_name = createAccount.data.data.bankName;
      await user.save();

      user.virtual_account_name = createAccount.data.data.accountName;
      await user.save();

      return createAccount.data;
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
          Type: "PENDING",
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
      const token = await this.generateToken();
      const bankHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const base_url = process.env.MINTYN_BASE_URL;
      const url = `${base_url}/api/v1/merchant/transfer-service/banks`;
      const response = await axios.get(url, {headers: bankHeaders});
      const banks = response.data.data;
      return {success: true, data: banks};
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException("Request failed");
    }
  }

  async saveAccountNumber(
    account_number: string,
    bank: string,
    user_id: string,
  ) {
    try {
      const res = await this.resolveAccountNumber(account_number, bank);

      const account_details = res.data.data;
      console.log(account_details);

      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new UnauthorizedException("Login and try again");
      }
      const isDuplicate = user.account_details.some(existingAccount => {
        return existingAccount.accountNumber === account_details.accountNumber;
      });

      if (isDuplicate) {
        throw new BadRequestException("Account number already exists");
      }
      user.account_details.push(account_details);
      await user.save();
      return {success: true, user: user.account_details};
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
      const token = await this.generateToken();
      const bankHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const base_url = process.env.MINTYN_BASE_URL;
      const url = `${base_url}/api/v1/merchant/transfer-service/banks`;
      const response = await axios.get(url, {headers: bankHeaders});
      const banks = response.data.data;
      const bank = banks.find(
        (bank: any) => bank.name.toLowerCase() === bank_name.toLowerCase(),
      );
      if (!bank) {
        throw new NotFoundException("Bank Not Found");
      }
      return bank.code;
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

  async resolveAccountNumber(account_number: string, bank: string) {
    try {
      const bankCode = await this.getBankCode(bank);
      console.log(bankCode);

      const token = await this.generateToken();
      const bankHeaders = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const base_url = process.env.MINTYN_BASE_URL;
      const url = `${base_url}/api/v1/merchant/transfer-service/resolve-account?accountNumber=${account_number}&bankCode=${bankCode}`;
      const response = await axios.get(url, {headers: bankHeaders});
      if (response.data.data === null) {
        throw new HttpException(
          {
            success: false,
            message: response.data.responseMessage,
          },
          400,
        );
      }
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
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new NotFoundException("User not found, Login and Try again.");
    }
    return {success: true, balance: user.balance};
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
      const generateRandomString = () => {
        const characters =
          "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let result = "";
        for (let i = 0; i < 12; i++) {
          const randomIndex = Math.floor(Math.random() * characters.length);
          result += characters.charAt(randomIndex);
        }
        return result;
      };
      const requestReference = generateRandomString();
      const nameEnquirySessionId = resolve.data.data.sessionId;
      const token = await this.generateToken();
      const Headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const base_url = process.env.MINTYN_BASE_URL;
      const url = `${base_url}/api/v1/merchant/transfer-service/transfer`;

      const data: Record<string, any> = {
        bankCode: bankCode,
        requestReference: requestReference,
        amount: amount,
        accountNumber: accountNumber,
        nameEnquirySessionId: nameEnquirySessionId,
      };
      if (narration !== undefined) {
        data.narration = narration;
      }
      console.log(data);
      console.log("here");

      const res = await axios.post(url, data, {headers: Headers});
      console.log(res.data);

      if (res.data.responseCode === "02") {
        console.log(res.data);
        throw new HttpException(
          {
            success: false,
            message: res.data.responseMessage,
          },
          400,
        );
      }
      const newBalance = balance - parseInt(res.data.data.totalAmount);
      user.balance = newBalance;
      console.log(newBalance);
      await user.save();
      const transactionObject: Record<string, any> = {
        Session_id: res.data.data.reference,
        userId: user.id,
        Type: "DEBIT",
        AmountSettled: res.data.data.totalAmount,
        Time: res.data.data.transactionDate,
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
      transaction.transactions.push(transactionObject);
      await transaction.save();
      console.log(transactionObject);

      console.log(transaction);

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
      const url =
      "https://rpc.ankr.com/blast_testnet_sepolia";
      const provider = new providers.JsonRpcProvider(url);

      if (user.wallet_address === undefined) {
        const wallet = Wallet.createRandom();
        const address = wallet.address;
        const balance = await provider.getBalance(address);
        const privateKey = wallet.privateKey;

        user.wallet = balance.toString();
        user.wallet_address = address;
        user.privateKey = privateKey;
        await user.save();
        const ngn = await this.convertEthToNgn(user.wallet);
        return {
          success: true,
          cryptoWalletBalanceInNgn: ngn,
          cryptoWalletBalanceInEth: user.wallet,
        };
      }
      const address = user.wallet_address;
      const balance = await provider.getBalance(address);
      user.wallet = balance.toString();
      await user.save();
      const ngn = await this.convertEthToNgn(user.wallet);
      return {
        success: true,
        cryptoWalletBalanceInNgn: ngn,
        cryptoWalletBalanceInEth: user.wallet,
      };
    } catch (error: any) {
      console.log(error);
      showObjectProperties(error)
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

  async convertNgntoEth(xNgn: string) {
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

  async sendEth(id: string, amount: string, toAddress: string) {
    try {
      const url =
      "https://rpc.ankr.com/blast_testnet_sepolia";
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
}
