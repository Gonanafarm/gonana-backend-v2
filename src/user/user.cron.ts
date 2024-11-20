import {Injectable} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import {UserService} from "../user/user.service";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {TransactionDocument} from "./transaction.schema";
import {User, UserDocument} from "./user.schema";
import {ConcordiumService} from "./concordium.service";
import {TokenDocument} from "./token.schema";

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
    @InjectModel("Token")
    private tokenModel: Model<TokenDocument>,
    private ccdService: ConcordiumService,
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

  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  async resetInsuranceStatus() {
    const users = await this.userModel.find();
    for (const user of users) {
      user.insurance = false;
      await user.save();
    }
  }

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

    // Verify if distribution is possible within constraints
    if (
      minTokens * usersCount > totalTokens ||
      maxTokens * usersCount < totalTokens
    ) {
      throw new Error(
        "Cannot satisfy distribution constraints. " +
          `Total tokens must be between ${minTokens * usersCount} and ${
            maxTokens * usersCount
          }`,
      );
    }

    const allocations: number[] = [];
    let remainingTokens = totalTokens;

    // Step 1: Distribute minimum tokens to everyone first
    for (let i = 0; i < usersCount; i++) {
      allocations.push(minTokens);
      remainingTokens -= minTokens;
    }

    // Step 2: Distribute remaining tokens randomly while respecting maxTokens
    while (remainingTokens > 0) {
      const eligibleIndices = allocations
        .map((tokens, index) => ({tokens, index}))
        .filter(({tokens}) => tokens < maxTokens);

      if (eligibleIndices.length === 0) {
        throw new Error(
          "Unable to distribute remaining tokens while respecting maxTokens",
        );
      }

      // Randomly select an eligible user
      const randomIndex = Math.floor(Math.random() * eligibleIndices.length);
      const selectedUser = eligibleIndices[randomIndex];

      // Calculate how many tokens we can add to this user
      const maxToAdd = Math.min(
        maxTokens - allocations[selectedUser.index],
        remainingTokens,
      );

      // Add a random amount between 1 and maxToAdd
      const toAdd = Math.max(1, Math.floor(Math.random() * maxToAdd));
      allocations[selectedUser.index] += toAdd;
      remainingTokens -= toAdd;
    }

    return allocations;
  }

  @Cron("0 9,10,11,12,13,14,15,16,17 * * *", {
    name: "tokenTransferCron",
    timeZone: "Africa/Lagos", // Adjust based on your time zone
  })
  async transferTokens() {
    const users = await this.userModel
      .find({
        ccd_wallet_address: {
          $type: "string",
        },
        $expr: {
          $gt: [{$strLenCP: "$ccd_wallet_address"}, 1], // Ensures the length is greater than 1
        },
      })
      .limit(5);
    const noOfUsers = users.length;
    const avalableTokensModel = await this.tokenModel.findById(
      "673d1556281bd9f9a842675c",
    );
    if (!avalableTokensModel || avalableTokensModel.token <= 0) {
      console.error("Insufficient tokens or token model not found.");
      return;
    }
    const avalableTokens = avalableTokensModel.token;
    const distributionArray = this.distributeTokens(
      avalableTokens,
      noOfUsers,
      700,
      1200,
    );
    for (let i = 0; i < users.length; i++) {
      if (users[i].airdropped === false) {
        await this.userService.depositGona(users[i].id, distributionArray[i]);
        console.log(`Sent ${distributionArray[i]} token to ${users[i].email}`);
        avalableTokensModel.token =
          avalableTokensModel.token - distributionArray[i];
        await avalableTokensModel.save();
        users[i].airdropped = true;
        await users[i].save();
      }
    }
  }
}
