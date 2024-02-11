import {MongooseModule} from "@nestjs/mongoose";
import {OutgoingOrderSchema} from "./outgoing.order.schema";

export const OutgoingOrderModel = MongooseModule.forFeature([
  {name: "OUTGOING_ORDERS", schema: OutgoingOrderSchema},
]);
