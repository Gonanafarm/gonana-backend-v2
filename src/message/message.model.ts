import {MongooseModule} from "@nestjs/mongoose";
import {MessageSchema} from "./message.schema";

export const MessageModel = MongooseModule.forFeature([
  {name: "Message", schema: MessageSchema},
]);
