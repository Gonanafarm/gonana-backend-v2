/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ProductDocument, Product } from "./product.schema";
import { paramCase } from "param-case";
import { GenericService } from "../generic/generic.service";


@Injectable()
export class ProductService extends GenericService {
  constructor(@InjectModel(Product.name) private productModel: Model<ProductDocument>) {
    super(productModel);
  }
}
