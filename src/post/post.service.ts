/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { PostSchema, Post, PostDocument } from "./post.schema";
import { GenericService } from "../generic/generic.service";

@Injectable()
export class PostService extends GenericService<PostDocument> {
  constructor(@InjectModel(Post.name) private productModel: Model<PostDocument>) {
    super(productModel);
  }
}
