import {MongooseModule} from "@nestjs/mongoose";
import {notificationSchema} from "./notification.schema";

export const NotificationModel = MongooseModule.forFeature([
  {name: "Notifications", schema: notificationSchema},
]);
