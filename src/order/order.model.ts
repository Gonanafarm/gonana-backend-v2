import { MongooseModule } from "@nestjs/mongoose";
import { Order, OrderDocument, OrderSchema } from "./order.schema";

export const OrderModel = MongooseModule.forFeature([
  { name: Order.name, schema: OrderSchema }
]);
