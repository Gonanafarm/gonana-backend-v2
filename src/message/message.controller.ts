import {Body, Controller, Post, Req, UseGuards} from "@nestjs/common";
import {MessageService} from "./message.service";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Request} from "express";
import {SendMessageDto} from "./message.dto";

@Controller("api/message")
export class MessageController {
  constructor(private readonly messageService: MessageService) {}
  @Post("send")
  @UseGuards(JwtAuthGuard)
  async sendMessage(@Req() req: Request, @Body() data: SendMessageDto) {
    //@ts-ignore
    const senderId = req.user.id;
    return await this.messageService.sendMessage(
      senderId,
      data.recipientId,
      data.message,
      data.channel,
      data.isUrl,
    );
  }
}
