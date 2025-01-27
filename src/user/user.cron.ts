import {Injectable} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {UserService} from "../user/user.service";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {TransactionDocument} from "./transaction.schema";
import {User, UserDocument} from "./user.schema";
import {ConcordiumService} from "./concordium.service";
import {UserMailerService} from "./user.mailer.service";

export const sumArray = (values: number[]): number => {
  let sum = 0;
  for (const value of values) {
    sum += value;
  }
  return sum;
};
@Injectable()
export class UserCronJob {
  constructor(
    private userService: UserService,
    @InjectModel("Transactions")
    private transactionModel: Model<TransactionDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    private ccdService: ConcordiumService,
    private mailerService: UserMailerService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_5PM)
  async UpdateInsuranceList() {
    const debit: number[] = [];
    const transactions = await this.transactionModel.find();
    const transactionOver200K = transactions.map(
      (transaction: TransactionDocument) => {
        transaction.transactions.forEach(transaction => {
          if (transaction.Type === "ORDER DEBIT") {
            debit.push(transaction.AmountSettled);
          }
        });
        if (sumArray(debit) >= 0) {
          return transaction.userId;
        }
        return null;
      },
    );

    const userIdsWithOrdersOver200k = transactionOver200K.filter(
      item => item !== null && item !== undefined,
    );

    for (const id of userIdsWithOrdersOver200k) {
      const user = await this.userModel.findById(id);
      if (!user) return;
      user.insurance = true;
      await user.save();
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async getUsersWithBalance() {
    const users = await this.userModel.find({balance: {$gt: 5}});
    const oneSignalIds = users.map(user => user.onesignal_id);
    const emails = users.map(user => user.email);
    console.log(oneSignalIds, emails);
    await this.userService.sendNotificationToParticularDevices(
      "Withdraw all funds from your virtual account, we will be changing payment providers soon and getting any funds back after that time may not be possible",
      "Important Notice",
      oneSignalIds,
    );
    this.mailerService.sendBulkEmails(
      emails,
      "Important Notice",
      "Withdraw all funds from your virtual account, we will be changing payment providers soon and getting any funds back after that time may not be possible",
    );
  }

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetInsuranceStatus() {
    const users = await this.userModel.find();
    for (const user of users) {
      user.insurance = false;
      await user.save();
    }
  }
}
