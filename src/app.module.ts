import * as path from "path";
import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from "@nestjs/common";
import {MongooseModule} from "@nestjs/mongoose";
import {MailerModule, HandlebarsAdapter} from "@nest-modules/mailer";
import {ServeStaticMiddleware} from "@nest-middlewares/serve-static";
import {MorganModule} from "nest-morgan";
import {LoggerMiddleware} from "./common/middleware/logger.middleware";
import {GlobalAccessLogger} from "./common/accessLogger";
import {AuthModule} from "./auth/auth.module";
import {UserModule} from "./user/user.module";
import config from "./config";
import { CatalogModule } from "./catalog/catalog.module";
import {JwtModule} from "@nestjs/jwt";
import {PassportModule} from "@nestjs/passport";
import {PublicModule} from "./public/public.module";
import { GeocodeModule } from "./geocoder/module";
import { MessageModule } from './message/message.module';
import { WalletModule } from "./wallet/wallet.module";
import { GaiaModule } from './gaia/gaia.module';

const DEV_TRANSPORTER = {
  service: 'Gmail',
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail email address
    pass: process.env.GMAIL_PASSWORD, // Your Gmail password or app-specific password
  },
};
@Module({
  imports: [
    AuthModule,
    UserModule,
    WalletModule,
    MorganModule,
    GeocodeModule,
    PublicModule,
    CatalogModule,
    MongooseModule.forRoot(config.db ?? ""),
    JwtModule.register({
      secret: "joshua",
      signOptions: {expiresIn: config.auth.jwtTokenExpireInSec},
    }),
    PassportModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: DEV_TRANSPORTER,
        defaults: {
          from: '"Gonana" <10xjoshua@gmail.com>',
        },
        template: {
          dir: __dirname + "/../templates",
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        options: {
          partials: {
            dir: path.join(__dirname, "templates/partials"),
            options: {
              strict: true,
            },
          },
        },
      }),
    }),
    MessageModule,
    GaiaModule,
  ],
  providers: config.isTest() ? undefined : [GlobalAccessLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    ServeStaticMiddleware.configure(
      path.resolve(__dirname, "..", "public"),
      config.static,
    );
    consumer.apply(ServeStaticMiddleware).forRoutes("public");

    if (!config.isTest()) {
      consumer.apply(LoggerMiddleware).forRoutes("api");
    }
  }
}
