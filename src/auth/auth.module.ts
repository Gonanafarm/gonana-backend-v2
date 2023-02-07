import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import config from '../config';
import { UserModule } from '../user/user.module';
import PassportModule from '../common/passport.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import setupSwagger from './auth.swagger';
import { JwtAuthGuard } from './jwt-auth.guard';

@Module({
  imports: [
    UserModule,
    JwtModule.register({
      secret: config.auth.secret,
      signOptions: { expiresIn: config.auth.jwtTokenExpireInSec },
    }),
    PassportModule,
  ],
  providers: [AuthService, LocalStrategy, JwtStrategy, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard],
})
export class AuthModule {}

setupSwagger(AuthModule);
