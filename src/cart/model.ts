import { MongooseModule } from "@nestjs/mongoose";
import { CartItem, CartItemDocument, CartItemSchema } from "./schema";

export const CartItemModel = MongooseModule.forFeature([
  { name: CartItem.name, schema: CartItemSchema }
]);
