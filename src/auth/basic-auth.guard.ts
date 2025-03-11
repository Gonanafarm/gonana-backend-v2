import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";
import {Reflector} from "@nestjs/core";

@Injectable()
export class BasicAuthGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers["authorization"];

    if (!authHeader) {
      throw new UnauthorizedException("Missing authorization header");
    }

    const [type, credentials] = authHeader.split(" ");

    if (type !== "Basic" || !credentials) {
      throw new UnauthorizedException("Invalid authorization header");
    }

    const [username, password] = Buffer.from(credentials, "base64")
      .toString()
      .split(":");

    if (
      username !== process.env.WEBHOOK_USERNAME ||
      password !== process.env.WEBHOOK_PASSWORD
    ) {
      throw new UnauthorizedException("Invalid username or password");
    }

    return true;
  }
}
