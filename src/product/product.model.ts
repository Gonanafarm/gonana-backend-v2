import { MongooseModule } from "@nestjs/mongoose";
import { Product, ProductSchema } from "./product.schema";

export const ProductModel = MongooseModule.forFeature([
  { name: Product.name, schema: ProductSchema }
]);
