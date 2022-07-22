import { Module } from "@nestjs/common";
import { } from "./product.controller";
import { ProductModel } from "./product.model";
import { ProductService } from "./product.service";

@Module({
  providers: [ProductService],
  imports: [ProductModel],
  exports: [ProductModel, ProductService],
})
export class ProductModule { }
