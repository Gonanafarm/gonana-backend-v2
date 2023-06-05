import { Module } from "@nestjs/common";

import { UserMailerService } from "./user.mailer.service";
import { UserService } from "./user.service";
import { UserModel } from "./user.model";
import setupSwagger from "./user.swagger";
import { UserController } from "./user.controller";
import { JwtModule } from "@nestjs/jwt";
import config from "../config";
import { UserEventHanders } from "./user.events-handler";
import { ProfileController } from "./profile.controller";

@Module({
  imports: [
    UserModel,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
  ],
  controllers: [UserController, ProfileController],
  providers: [UserMailerService, UserService, UserEventHanders],
  exports: [UserService],
})
export class UserModule {}

setupSwagger(UserModule);
