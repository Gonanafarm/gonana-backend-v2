import {Injectable} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import * as moment from "moment"
@Injectable()
export class OrderCronJob {
  @Cron(CronExpression.EVERY_30_SECONDS)
  handleCron() {
    console.log("Called every 30 seconds");
  }
}
