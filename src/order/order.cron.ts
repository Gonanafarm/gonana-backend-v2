import {Injectable} from "@nestjs/common";
import {Cron, CronExpression} from "@nestjs/schedule";
import * as moment from "moment";
import {OrderService} from "./order.service";
import {IncomingOrderDocument} from "./incoming.order.schema";
import {UserMailerService} from "../user/user.mailer.service";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {OrderDocument} from "./outgoing.order.schema";
import {UserDocument} from "../user/user.schema";
//import {UserService} from "../user/user.service";
@Injectable()
export class OrderCronJob {
  constructor(
    //@ts-ignore
    @InjectModel("OUTGOING_ORDERS")
    private outgoingOrderModel: Model<OrderDocument>,

    //@ts-ignore
    @InjectModel("INCOMING_ORDERS")
    private incomingOrderModel: Model<IncomingOrderDocument>,

    private orderService: OrderService,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    private userMailerService: UserMailerService,
  ) //   private userService: UserService,
  {}
  @Cron(CronExpression.EVERY_DAY_AT_11AM)
  async handleOutgoingOrders() {
    const outgoingOrders = await this.outgoingOrderModel.find();
    const farmerDefaulters = outgoingOrders
      .map((item: OrderDocument) => {
        if (item.farmer_shipped !== true) {
          return;
        }
        const today = moment();
        const farmer_ship_date = moment(item.farmer_ship_date);
        if (!farmer_ship_date.isValid()) {
          console.log(`Invalid date: ${item.farmer_ship_date}`);
          return;
        }
        const diffInDays = today.diff(farmer_ship_date, "days");

        if (diffInDays > 3) {
          return item;
        } else return;
      })
      .filter(item => item !== null && item !== undefined);

    if (farmerDefaulters.length < 1) {
      return;
    }
    const farmerIds = farmerDefaulters
      .map(item => {
        if (item) {
          return {
            farmerId: item.farmer_id,
            orderId: item.shipbubble_id,
            customerId: item.customer_id,
          };
        } else return;
      })
      .filter(item => item !== null || undefined);

    const farmerPromise = farmerIds
      .map(async item => {
        if (item) {
          const farmer = await this.userModel.findById(item.farmerId);
          if (!farmer) return;
          const customer = await this.userModel.findById(item.customerId);
          if (!customer) return;
          return {
            farmer: farmer,
            customer: customer,
            orderId: item.orderId,
          };
        } else return null;
      })
      .filter(item => item !== null || undefined);

    const farmers = await Promise.all(farmerPromise);
    farmers.forEach(item => {
      const customerAddressLength = item?.customer.address.length as number;
      const customerAddressIndex = customerAddressLength - 1;
      this.userMailerService.farmerBehindSchedule(
        item?.farmer.email as string,
        item?.orderId as string,
        `${item?.customer.first_name}`,
        `${item?.customer.address[customerAddressIndex].address}`,
      );
      // if (item?.farmer.onesignal_id) {
      //   const message = {
      //     app_id: process.env.ONESIGNAL_APP_ID,
      //     contents: {en: `You failed to deliver some products on time`},
      //     included_segments: ["include_player_ids"],
      //     include_player_ids: [item.farmer.onesignal_id],
      //     content_available: true,
      //     onesignal_notification_accent_color: "FF00FF00",
      //     //    big_picture: payload.images[0],
      //     //    large_icon: payload.images[0],
      //     // data: {
      //     //   PushTitle: `Products Posted`,
      //     // },
      //     headings: {
      //       en: `PRODUCTS BEHIND SCHEDULE`,
      //     },
      //   };
      //   this.userService.sendNotificationToDevice(message);
      // }
    });
  }
}
