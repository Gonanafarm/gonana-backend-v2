import {MongooseModule} from "@nestjs/mongoose";
import {incomingOrderSchema} from "./incoming.order.schema";

export const IncomingOrderModel = MongooseModule.forFeature([
  {
    name: "INCOMING_ORDERS",
    schema: incomingOrderSchema,
  },
]);
