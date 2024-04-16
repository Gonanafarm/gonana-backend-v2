import {Module, forwardRef} from "@nestjs/common";
import {UserMailerService} from "./user.mailer.service";
import {UserService} from "./user.service";
import {UserModel} from "./user.model";
import {OtpModel} from "./otp.model";
import setupSwagger from "./user.swagger";
import {UserController} from "./user.controller";
import {JwtModule} from "@nestjs/jwt";
import config from "../config";
import {UserEventHanders} from "./user.events-handler";
import {ProfileController} from "./profile.controller";
import {CloudinaryService} from "../post/cloudinary.service";
import {HttpModule} from "@nestjs/axios";
import {LogisticsService} from "./logistics.service";
import {PostModule} from "../post/post.module";
import {GeocodeModule} from "../geocoder/module";
import {LogisticsController} from "./logistics.controller";
import {TransactionController} from "./transaction.controller";
import {TransactionModel} from "./transaction.model";
import {NotificationModel} from "./notification.model";
import {ScheduleModule} from "@nestjs/schedule";
import {UserCronJob} from "./user.cron";

@Module({
  imports: [
    forwardRef(() => PostModule),
    GeocodeModule,
    OtpModel,
    UserModel,
    ScheduleModule.forRoot(),
    TransactionModel,
    NotificationModel,
    HttpModule,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
  ],
  controllers: [
    UserController,
    ProfileController,
    LogisticsController,
    TransactionController,
  ],
  providers: [
    UserMailerService,
    UserService,
    UserEventHanders,
    CloudinaryService,
    LogisticsService,
    UserCronJob,
  ],
  exports: [UserService, UserModel, LogisticsService, UserMailerService],
})
export class UserModule {}

setupSwagger(UserModule);
