/* eslint-disable no-useless-catch */
import {
  Controller,
  Injectable,
  NotFoundException,
  HttpException,
  BadRequestException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {PostSchema, Post, PostDocument} from "./post.schema";
import {GenericService} from "../generic/generic.service";
import {EventEmitter2} from "@nestjs/event-emitter";
import {DiscountDocument} from "./discount.schema";
import {UserDocument, User} from "../user/user.schema";
import {GeocodeService} from "../geocoder/service";
import {UserService} from "../user/user.service";
import {LogisticsService} from "../user/logistics.service";
import {
  DeletionException,
  ResourceNotFoundException,
} from "../common/exceptions";
import axios from "axios";

const key = process.env.SHIPBUBBLE_API_KEY;
const base_url = process.env.SHIPBUBBLE_BASE_URL;
const Headers = {
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};
@Injectable()
export class PostService extends GenericService<PostDocument> {
  constructor(
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    @InjectModel("Discounts") private discountModel: Model<DiscountDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private logisticsService: LogisticsService,
    private geocoderService: GeocodeService,
    private eventEmmiter: EventEmitter2,
    private userService: UserService,
  ) {
    super(productModel);
  }

  async updatePrice(id: string, price: number) {
    try {
      const product = await this.productModel.findById(id);
      if (!product) {
        throw new NotFoundException("Product Not found");
      }

      if (price < product.amount) {
        const productid = product.id;
        this.eventEmmiter.emit("discount trigger", productid);
      }

      if (price > product.amount) {
        const productid = product.id;
        this.eventEmmiter.emit("delete discount", productid);
      }

      product.amount = price;
      const usd_price = parseFloat(
        await this.userService.convertNgntoUsd(product.amount.toString()),
      );
      product.usd_price = usd_price;
      const ccd_price = parseFloat(
        await this.userService.convertNgntoCcd(product.amount.toString()),
      );
      product.ccd_price = ccd_price;
      const eth_price = parseFloat(
        await this.userService.convertNgntoEth(product.amount.toString()),
      );
      product.eth_price = eth_price.toString();
      await product.save();
      return product;
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async createDiscount(productid: string) {
    const exists = await this.discountModel.findOne({productid: productid});
    if (exists) return;
    const discount = await this.discountModel.create({productid: productid});
    return discount;
  }

  async deleteDiscount(productid: string) {
    const exists = await this.discountModel.findOne({productid: productid});
    if (!exists) {
      return;
    }
    const deleteProduct = await this.discountModel.deleteOne({
      productid: productid,
    });
    if (!deleteProduct) {
      throw DeletionException();
    }
    return true;
  }

  async discountedProducts(limit?: string, page?: string) {
    const productsPerPage = 15;
    let limitToNumber;
    let pagToNumber;
    if (limit) {
      limitToNumber = parseInt(limit);
    }
    if (page) {
      pagToNumber = parseInt(page);
      // Adjust the page number to start from 1
      pagToNumber = Math.max(1, pagToNumber);
    } else {
      // If page is not provided, set it to 1 by default
      pagToNumber = 1;
    }
    const lim =
      limitToNumber === undefined || limitToNumber < 1 ? 15 : limitToNumber;
    const skipCount = (pagToNumber - 1) * productsPerPage;

    const products = await this.discountModel
      .find()
      .sort({_id: -1}) // Lifo order
      .skip(skipCount)
      .limit(lim);

    if (products.length < 1) {
      throw new NotFoundException("No Doscounted Products");
    }

    const ids = products.map(product => product.productid);
    const discountedProductsPromises = ids.map(async id => {
      const product = await this.productModel.findOne({_id: id});
      if (!product) return;
      // const usd_price = parseFloat(
      //   await this.userService.convertNgntoUsd(
      //     product.amount.toString() as string,
      //   ),
      // );
      // product.usd_price = usd_price;
      // await product.save();

      return product !== null ? product : undefined;
    });
    const discountedProducts = await Promise.all(discountedProductsPromises);
    const filteredDiscountedProducts = discountedProducts.filter(
      product => product !== undefined,
    );
    if (filteredDiscountedProducts.length < 1) {
      throw new NotFoundException("There are no products with discounts");
    }

    return {success: true, data: filteredDiscountedProducts};
  }

  async getByPublisherId(
    id: string,
    type?: string,
    limit?: string,
    page?: string,
  ) {
    try {
      const query: Record<string, unknown> = {publisher_id: id};

      if (type !== undefined) {
        query.type = type;
      }
      const productsPerPage = 15;
      let limitToNumber;
      let pagToNumber;
      if (limit) {
        limitToNumber = parseInt(limit);
      }
      if (page) {
        pagToNumber = parseInt(page);
        // Adjust the page number to start from 1
        pagToNumber = Math.max(1, pagToNumber);
      } else {
        // If page is not provided, set it to 1 by default
        pagToNumber = 1;
      }
      const lim =
        limitToNumber === undefined || limitToNumber < 1 ? 15 : limitToNumber;
      const skipCount = (pagToNumber - 1) * productsPerPage;

      const products = await this.productModel
        .find(query)
        .sort({_id: -1}) // Lifo order
        .skip(skipCount)
        .limit(lim);
      const oneNgnInUsd = parseFloat(
        await this.userService.convertNgntoUsd("1"),
      );
      const oneNgnInCcd = parseFloat(
        await this.userService.convertNgntoCcd("1"),
      );
      const oneNgnInEth = parseFloat(
        await this.userService.convertNgntoEth("1"),
      );

      const newProductsPromises = products.map(
        async (product: PostDocument) => {
          const usd_price = product.amount * oneNgnInUsd;
          const ccd_price = product.amount * oneNgnInCcd;
          const eth_price = product.amount * oneNgnInEth;

          product.eth_price = eth_price.toString();
          product.ccd_price = ccd_price;
          product.usd_price = usd_price;
          await product.save();
          return product;
        },
      );
      const newProducts = await Promise.all(newProductsPromises);
      if (newProducts.length < 1) {
        throw new NotFoundException("Products Not Found");
      }

      return {
        success: true,
        data: products,
      };
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async get(type: string, title?: string, limit?: string, page?: string) {
    try {
      const query: Record<string, unknown> = {};
      if (type !== undefined) {
        query.type = type;
      }
      if (title !== undefined) query.title = new RegExp(title, "i"); //Case Insensitivity
      const productsPerPage = 15;
      let limitToNumber;
      let pagToNumber;
      if (limit) {
        limitToNumber = parseInt(limit);
      }
      if (page) {
        pagToNumber = parseInt(page);
        // Adjust the page number to start from 1
        pagToNumber = Math.max(1, pagToNumber);
      } else {
        // If page is not provided, set it to 1 by default
        pagToNumber = 1;
      }
      const lim =
        limitToNumber === undefined || limitToNumber < 1 ? 15 : limitToNumber;
      const skipCount = (pagToNumber - 1) * productsPerPage;

      const products = await this.productModel
        .find(query)
        .sort({_id: -1}) // Lifo order
        .skip(skipCount)
        .limit(lim);
      if (products.length < 1) {
        throw new NotFoundException("Products Not Found");
      }

      const productPromises = products.map(async (product: any) => {
        const id = product.publisher_id;
        const user = await this.userModel.findById(id);
        return {
          product: product,
          ownerId: user?._id,
          ownerPhoto: user?.profile_photo,
          ownerName: `${user?.last_name} ${user?.first_name}`,
        };
      });
      const productsWithOwners = await Promise.all(productPromises);

      return {success: true, data: productsWithOwners};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async getUsersProducts(
    id: string,
    type?: string,
    limit?: string,
    page?: string,
  ) {
    try {
      const query: Record<string, unknown> = {};
      if (type !== undefined) {
        query.type = type;
      }
      query.publisher_id = id;
      const productsPerPage = 5;
      let limitToNumber;
      let pagToNumber;
      if (limit) {
        limitToNumber = parseInt(limit);
      }
      if (page) {
        pagToNumber = parseInt(page);
        // Adjust the page number to start from 1
        pagToNumber = Math.max(1, pagToNumber);
      } else {
        // If page is not provided, set it to 1 by default
        pagToNumber = 1;
      }
      const lim =
        limitToNumber === undefined || limitToNumber < 1 ? 5 : limitToNumber;
      const skipCount = (pagToNumber - 1) * productsPerPage;

      const products = await this.productModel
        .find(query)
        .sort({_id: -1}) // Lifo order
        .skip(skipCount)
        .limit(lim);
      if (products.length < 1) {
        throw new NotFoundException("Products Not Found");
      }
      const oneNgnInUsd = parseFloat(
        await this.userService.convertNgntoUsd("1"),
      );
      const oneNgnInCcd = parseFloat(
        await this.userService.convertNgntoCcd("1"),
      );
      const oneNgnInEth = parseFloat(
        await this.userService.convertNgntoEth("1"),
      );

      const productPromises = products.map(async (product: PostDocument) => {
        const usd_price = product.amount * oneNgnInUsd;
        const ccd_price = product.amount * oneNgnInCcd;
        const eth_price = product.amount * oneNgnInEth;

        product.ccd_price = ccd_price;
        product.eth_price = eth_price.toString();
        product.usd_price = usd_price;
        await product.save();
        const id = product.publisher_id;
        const user = await this.userModel.findById(id);
        return {
          product: product,
          ownerId: user?._id,
          ownerPhoto: user?.profile_photo,
          ownerName: `${user?.last_name} ${user?.first_name}`,
        };
      });
      const productsWithOwners = await Promise.all(productPromises);

      return {success: true, data: productsWithOwners};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async like(postId: string, userId: string) {
    try {
      const post = await this.productModel.findById(postId);
      if (!post) throw new NotFoundException("Post not found");
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException("User not found");
      const likesArray = post.likes;

      if (likesArray.some(obj => obj.id === user.id)) {
        throw new BadRequestException("You have already liked this post");
      }
      const userData = {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        photo: user.profile_photo,
      };
      post.likes.push(userData);
      await post.save();
      user.likedPosts.push(postId);
      await user.save();
      const likesCount = likesArray.length;
      // this.eventEmmiter.emit("Like", {
      //   userId: userId,
      //   postId: postId,
      //   likes: likesCount,
      // });

      return {
        success: true,
        message: `${user.first_name} liked this post`,
        likesCount: likesCount,
      };
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }
  async unlike(userId: string, postId: string) {
    try {
      const post = await this.productModel.findById(postId);
      if (!post) throw new NotFoundException("Post not found");
      const user = await this.userModel.findById(userId);
      if (!user) throw new NotFoundException("User not found");
      const likesArray = post.likes;
      if (!likesArray.some(obj => obj.id === user.id)) {
        throw new BadRequestException("User has not liked this post");
      }
      const userIndex1 = likesArray.findIndex(obj => obj.id === user.id);

      if (userIndex1 !== -1) {
        // User has liked this post, so remove them from the array
        likesArray.splice(userIndex1, 1);
        await post.save();
      } else {
        throw new BadRequestException("User has not liked this post");
      }

      const userIndex = user.likedPosts.indexOf(postId);
      user.likedPosts.splice(userIndex, 1);
      await user.save();
      const likesCount = likesArray.length;
      // this.eventEmmiter.emit("Unlike", {
      //   userId: userId,
      //   postId: postId,
      //   likes: likesCount,
      // });
      return {
        success: true,
        message: "You have disliked this post",
        likesCount: likesCount,
      };
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async likesCount(postId: string) {
    try {
      const post = await this.productModel.findById(postId);
      if (!post) throw new NotFoundException("Post not found");
      const likes = post.likes.length;
      return {success: true, likesCount: likes};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async getUsersThatLikedPost(postId: string) {
    try {
      const post = await this.productModel.findById(postId);
      if (!post) throw new NotFoundException("Post not found");
      const likesArray = post.likes;
      if (likesArray.length < 1) {
        throw new NotFoundException("No users have liked this post");
      }

      return {success: true, data: likesArray};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
    }
  }

  async comment(postId: string, comment: string, userId: string) {
    const post = await this.productModel.findById(postId);
    if (!post) throw new NotFoundException("Post not found");
    const user = await this.userModel.findById(userId);
    if (!user)
      throw new NotFoundException("User not found Login and Try again");

    if (comment.length < 2) throw new BadRequestException(`Comment too short`);
    const data = {
      username: `${user.first_name} ${user.last_name}`,
      comment: comment,
      image: `${user.profile_photo}`,
    };
    //fix
    post.comments.push(data);
    await post.save();
    return {success: true, message: `commented: ${comment}`};
  }

  async getPostComments(postId: string) {
    const post = await this.productModel.findById(postId);
    if (!post) throw new NotFoundException(`Post with id ${postId} not found`);
    const comments = post.comments;
    if (comments.length < 1) {
      throw new NotFoundException(`No comments on this post`);
    }
    return {success: true, comments: comments};
  }

  async rating(postId: string, rating: number) {
    const post = await this.productModel.findById(postId);
    if (!post) throw new NotFoundException("Post not found");
    const postRating = post.rating;
    const newRating = Math.ceil((rating + postRating) / 2);
    post.rating = newRating;
    await post.save();
    return {success: true, postRating: post.rating};
  }

  async convertNgntoUsd(xNgn: string) {
    const key = process.env.COINMARKETCAP_API_KEY;
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/tools/price-conversion?amount=1&symbol=USD&convert=NGN",
      {
        headers: {
          "X-CMC_PRO_API_KEY": key,
        },
      },
    );
    const usd = parseInt(xNgn) / Math.round(response.data.data.quote.NGN.price);
    const roundedUsd = this.userService.roundToSignificantFigures(usd, 9);
    return roundedUsd.toString();
  }
}
