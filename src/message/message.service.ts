import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {UserDocument} from "../user/user.schema";
import {MessageDocument} from "./message.schema";
import {ably} from "../main";
import {OrderService} from "../order/order.service";

@Injectable()
export class MessageService {
  constructor(
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    //ts-ignore
    @InjectModel("Message") private messageModel: Model<MessageDocument>,
    private orderService: OrderService,
  ) {}

  async sendMessage(
    senderId: string,
    receiverId: string,
    message: string,
    channel: string,
    isUrl?: boolean,
  ) {
    try {
      if (receiverId === senderId) {
        throw new BadRequestException("Cannot message yourself");
      }
      const isValidShipbubbleId = await this.orderService.isValidShipbubbleId(
        channel,
      );
      if (!isValidShipbubbleId) {
        throw new BadRequestException("Invalid channel or order completed");
      }
      const sender = await this.userModel.findById(senderId);
      if (!sender) {
        throw new BadRequestException("Invalid Token");
      }

      const receiver = await this.userModel.findById(receiverId);
      if (!receiver) {
        throw new NotFoundException("Receiver not found");
      }
      let channelName: string;
      let messageModel: MessageDocument;
      const messageExists = await this.getMessageBySenderReceiverId(
        senderId,
        receiverId,
        channel,
      );

      if (messageExists) {
        channelName = messageExists.channel;
        messageModel = await this.messageModel.create({
          receiverId: receiverId,
          message: message,
          senderId: senderId,
          isUrl: isUrl,
          channel: channelName,
        });
      } else {
        channelName = channel;
        messageModel = await this.messageModel.create({
          receiverId: receiverId,
          message: message,
          isUrl: isUrl,
          senderId: senderId,
          channel: channelName,
        });
      }

      const ablyChannel = ably.channels.get(channelName);
      await ablyChannel.publish("message", messageModel);
      return {
        success: true,
        message: messageModel.message,
        channel: messageModel.channel,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getMessagesBetweenUsers(userId: string, receiverId: string) {
    const messages = await this.messageModel
      .find({
        $or: [
          {senderId: userId, receiverId: receiverId},
          {senderId: receiverId, receiverId: userId}, // swapped sender and receiver
        ],
      })
      .sort({createdAt: -1});
    return messages;
  }
  async getMessageBySenderReceiverId(
    senderId: string,
    receiverId: string,
    shipbubbleId: string,
  ) {
    const message = await this.messageModel.findOne({
      $or: [
        {senderId, receiverId, channel: shipbubbleId},
        {senderId: receiverId, receiverId: senderId, channel: shipbubbleId},
      ],
    });
    return message;
  }
  async getAllMessageBySenderReceiverIdChannel(
    senderId: string,
    receiverId: string,
    shipbubbleId: string,
  ) {
    const message = await this.messageModel.find({
      $or: [
        {senderId, receiverId, channel: shipbubbleId},
        {senderId: receiverId, receiverId: senderId, channel: shipbubbleId},
      ],
    });
    return message;
  }
}
