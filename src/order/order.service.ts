/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  Controller,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {Order, OrderDocument} from "./order.schema";
import {GenericService} from "../generic/generic.service";
import {CartItem} from "../cart/schema";
import {Post, PostDocument} from "../post/post.schema";
import {User, UserDocument} from "../user/user.schema";
import axios from "axios";


@Injectable()
export class OrderService {
  //@ts-ignore
  constructor(
    //@ts-ignore
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
  );



}
