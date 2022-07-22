import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable } from "@nestjs/common";
import { UserService } from "../user/user.service";
import { User } from "../user/user.interface";
import config from "../config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.auth.secret,
    });
  }

  async validate(payload: { sub: string }): Promise<{sub: string}> {
    return { ...payload }
  }
}
