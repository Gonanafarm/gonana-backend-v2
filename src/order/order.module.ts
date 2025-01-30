import {Module} from "@nestjs/common";
import {} from "./order.controller";
import {OutgoingOrderModel} from "./outgoing.order.model";
import {OrderService} from "./order.service";
import {PostModule} from "../post/post.module";
import {PostModel} from "../post/post.model";
import {UserModule} from "../user/user.module";
import {UserModel} from "../user/user.model";
import {UserService} from "../user/user.service";
import {IncomingOrderModel} from "./incoming.order.model";
import {UserMailerService} from "../user/user.mailer.service";
import {ScheduleModule} from "@nestjs/schedule";
import {OrderCronJob} from "./order.cron";
import {PostService} from "../post/post.service";
import {TransactionModel} from "../user/transaction.model";
import {OtpModel} from "../user/otp.model";
import {JwtModule} from "@nestjs/jwt";
import config from "../config";
import {CloudinaryService} from "../post/cloudinary.service";
import {NotificationModel} from "../user/notification.model";
import {ConcordiumService} from "../user/concordium.service";
import {MessageService} from "../message/message.service";
import {MessageModule} from "../message/message.module";
import { KycModule } from "../kyc/kyc.module";
import { KycModel } from "../kyc/kyc.model";
@Module({
  providers: [
    OrderService,
    PostModule,
    UserModule,
    KycModule,
    UserService,
    ConcordiumService,
    CloudinaryService,
    UserMailerService,
    OrderCronJob,
  ],
  imports: [
    ScheduleModule.forRoot(),
    MessageModule,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
    OutgoingOrderModel,
    PostModel,
    TransactionModel,
    KycModel,
    UserModel,
    IncomingOrderModel,
    OtpModel,
    NotificationModel,
  ],
  exports: [OutgoingOrderModel, OrderService, IncomingOrderModel],
})
export class OrderModule {}
