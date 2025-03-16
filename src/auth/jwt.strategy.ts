import {ExtractJwt, Strategy} from "passport-jwt";
import {PassportStrategy} from "@nestjs/passport";
import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {UserService} from "../user/user.service";
import config from "../config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: config.auth.secret,
    });
  }

  async validate(payload: {sub: string}): Promise<any> {
    const user = await this.userService.findById(payload.sub);

    if (!user || user.disabled === true) {
      throw new HttpException(
        {
          success: false,
          message:
            "Account has been disabled, Contact customer care to gain access",
        },
        HttpStatus.FORBIDDEN,
      );
    }

    return {...payload};
  }
}
