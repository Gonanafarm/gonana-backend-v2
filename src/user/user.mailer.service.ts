import { Injectable } from '@nestjs/common';
import { MailerService } from '@nest-modules/mailer';

import config from '../config';

@Injectable()
export class UserMailerService {
  constructor(private readonly mailerService: MailerService) {}

  sendActivationMail(
    email: string,
    userId: string,
    activationToken: string,
    origin: string,
  ) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          subject: 'Activate your account',
          template: 'activate-account', // The `.pug`, `.ejs` or `.hbs` extension is appended automatically.
          context: {
            link: `${origin}/activate/${userId}/${activationToken}\n`,
          },
        })
        .catch();
    }
  }

  sendForgottenPasswordMail(
    to: string,
    passwordResetToken: string,
    origin: string,
  ) {
    this.mailerService
      .sendMail({
        to,
        subject: 'Reset your password',
        template: 'reset-password',
        context: {
          resetLink: `${origin}/reset-password/${passwordResetToken}`,
        },
      })
      .catch(console.log);
  }

  sendResetPasswordMail(email: string) {
    if (!config.isTest()) {
      this.mailerService
        .sendMail({
          to: email,
          template: 'on-password-reset',
          subject: 'Your password has been changed',
          context: {
            message: `This is a confirmation that the password for your account ${email} has just been changed.\n`,
          },
        })
        .catch();
    }
  }
}
