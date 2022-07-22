import * as path from "path";
import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MailerModule, HandlebarsAdapter } from "@nest-modules/mailer";
import { ServeStaticMiddleware } from "@nest-middlewares/serve-static";
import { MorganModule } from "nest-morgan";

import { LoggerMiddleware } from "./common/middleware/logger.middleware";
import { GlobalAccessLogger } from "./common/accessLogger";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import config from "./config";
import { CatalogModule } from "./catalog/catalog.module";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";

const DEV_TRANSPORTER = {
  host: "smtp-relay.sendinblue.com",
  port: 587,
  auth: {
    user: "developercircus@gmail.com",
    pass: "CR2bIMjv3XZkrTEL",
  },
};

@Module({
  imports: [
    AuthModule,
    MorganModule,
    CatalogModule,
    MongooseModule.forRoot(config.db),
    JwtModule.register({
      secret: "joshua",
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    PassportModule,
    MailerModule.forRootAsync({
      useFactory: () => ({
        transport: DEV_TRANSPORTER,
        defaults: {
          from: config.mail.from,
        },
        template: {
          dir: __dirname + '/../templates',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
        options: {
          partials: {
            dir: path.join(__dirname, 'templates/partials'),
            options: {
              strict: true,
            },
          },
        },
      }),
    }),
    UserModule,
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
