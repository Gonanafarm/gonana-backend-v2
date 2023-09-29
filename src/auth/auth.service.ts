import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import {JwtService} from "@nestjs/jwt";
import {comparePassword} from "../common/auth";
import {UserService} from "../user/user.service";
import {LoginCredentialsException} from "../common/exceptions";
import {
  ActivateParams,
  ForgottenPasswordDto,
  ResetPasswordDto,
  SignUpDto,
} from "./auth.interface";
import {User, UserDocument} from "../user/user.schema";
import {EventEmitter2} from "@nestjs/event-emitter";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private eventEmitter: EventEmitter2,
  ) {}
  async validateUser(email: string, password: string): Promise<UserDocument> {
    const res = await this.userService.findByEmail(email);
    const user = res.user

    if (!comparePassword(password, user.password)) {
      throw LoginCredentialsException();
    }
    return user;
  }

  async activate({userId, activationToken}: ActivateParams) {
    const user = await this.userService.activate(userId, activationToken);

    return {
      token: this.jwtService.sign({id: user.id}, {subject: `${user.id}`}),
      user: user.getPublicData(),
    };
  }

  // user jwt decode obj
  async login(user?: any) {
    this.eventEmitter.emit("account.login", user);

    console.log(user?.getPublicData(), " On Login user ");
    return {
      token: this.jwtService.sign(
        {...user?.getPublicData()},
        {subject: `${user?.id}`},
      ),
      user: user?.getPublicData(),
    };
  }

  async loginAdmin(user?: any) {
    this.eventEmitter.emit("account.login", user);

    if (user.account_type !== "ADMIN") {
      throw new UnauthorizedException();
    }
    console.log(user?.getPublicData(), " On Login user ");
    return {
      token: this.jwtService.sign(
        {...user?.getPublicData()},
        {subject: `${user?.id}`},
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
      userData.account_type,
      userData.bvn
    );

    return {
      token: this.jwtService.sign(
        {...user.getPublicData()},
        {subject: `${user.id}`},
      ),
      user: user.getPublicData(),
    };
  }

  async forgottenPassword(email: string) {
    return await this.userService.forgottenPassword(email);
  }

  async resetPassword(email: string, password: string) {
    return await this.userService.resetPassword(email, password);
  }

  async verifyOtp(otp: string) {
    return await this.userService.verifyPasswordOtp(otp);
  }
}