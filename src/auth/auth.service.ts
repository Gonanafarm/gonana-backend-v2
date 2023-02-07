import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { comparePassword } from '../common/auth';
import { UserService } from '../user/user.service';
import { LoginCredentialsException } from '../common/exceptions';

import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
} from './auth.interface';
import { User, UserDocument } from '../user/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<UserDocument> {
    const user = await this.userService.findByEmail(email);

    if (!comparePassword(password, user.password)) {
      throw LoginCredentialsException();
    }
    return user;
  }

  async activate({ userId, activationToken }: ActivateParams) {
    const user = await this.userService.activate(userId, activationToken);

    return {
      token: this.jwtService.sign({ id: user.id }, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }

  // user jwt decode obj
  async login(user?: any) {
    return {
      token: this.jwtService.sign(
        { ...user?.getPublicData() },
        { subject: `${user?.id}` },
      ),
      user: user?.getPublicData(),
    };
  }

  async signUpUser(userData: SignUpDto, origin: string) {
    const user = await this.userService.createAccount(
      userData.first_name,
      userData.last_name,
      userData.phone,
      userData.email,
      userData.password,
      origin,
      userData.account_type
    );

    return {
      token: this.jwtService.sign(
        { ...user.getPublicData() },
        { subject: `${user.id}` },
      ),
      user: user.getPublicData(),
    };
  }

  async forgottenPassword({ email }: ForgottenPasswordDto, origin: string) {
    return await this.userService.forgottenPassword(email, origin);
  }

  async resetPassword({
    email,
    passwordResetToken,
    password,
  }: ResetPasswordDto) {
    const user = await this.userService.resetPassword(
      email,
      passwordResetToken,
      password,
    );

    return {
      token: this.jwtService.sign({}, { subject: `${user.id}` }),
      user: user.getPublicData(),
    };
  }
}
