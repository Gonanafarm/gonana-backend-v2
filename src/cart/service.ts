/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {CartItem, CartItemDocument} from "./schema";
import {GenericService} from "../generic/generic.service";
import {Post, PostDocument} from "../post/post.schema";
import {UserDocument} from "../user/user.schema";
import {UserService} from "../user/user.service";
import {OrderService} from "../order/order.service";
import {
  UserMailerService,
  convertArrayToString,
} from "../user/user.mailer.service";
import {LogisticsService} from "../user/logistics.service";
import {EventEmitter2} from "@nestjs/event-emitter";
import {ethers, providers} from "ethers";
import {TransactionDocument} from "../user/transaction.schema";
import axios from "axios";
import {ConcordiumService} from "../user/concordium.service";
const abi = require("../../abi.json");

const key = process.env.SHIPBUBBLE_API_KEY;
const base_url = process.env.SHIPBUBBLE_BASE_URL;
const Headers = {
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};
export const getAbbreviation = (inputString: string): string => {
  // Convert the input string to uppercase
  const upperCaseString = inputString.toUpperCase();

  // Extract the initials
  const initials = upperCaseString
    .split(" ")
    .map(word => word.charAt(0))
    .join("");

  return initials;
};

export const generateRandomSixDigitNumber = (): number => {
  return Math.floor(100000 + Math.random() * 900000);
};

export const generateRandomString = (): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 12; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};
@Injectable()
export class CartItemService extends GenericService<CartItemDocument> {
  constructor(
    //@ts-ignore
    @InjectModel(CartItem.name) private cartItemsModel: Model<CartItemDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    //@ts-ignore
    @InjectModel("Transactions")
    private transactionsModel: Model<TransactionDocument>,
    private readonly userService: UserService,
    private readonly logisticsService: LogisticsService,
    private readonly userMailerService: UserMailerService,
    private readonly eventEmitter: EventEmitter2,
    private readonly orderService: OrderService,
    private readonly ccdService: ConcordiumService,
  ) {
    super(cartItemsModel);
  }

  async createCartItem(publisher_id: string, product_id: string) {
    try {
      const product = await this.productModel.findById(product_id);
      if (!product) {
        throw new NotFoundException("Product not found");
      }
      console.log(product);

      const user_id = product.publisher_id;

      const user = await this.userModel.findById(user_id);

      if (!user) {
        throw new NotFoundException(
          "The Owner of the Product may have deleted their account",
        );
      }
      if (product.quantity < 1) {
        return {success: false, message: "Product is out of stock"};
      }
      const cartModel = await this.cartItemsModel.findOne({
        publisher_id: publisher_id,
      });
      console.log(cartModel);

      if (!cartModel) {
        const cart = await this.cartItemsModel.create({
          publisher_id: publisher_id,
          product_id: [product_id],
        });
        return {success: true, data: cart};
      }
      const productexists = cartModel.product_id.includes(product_id);
      if (productexists) {
        throw new ConflictException("Product already exists in cart");
      }
      cartModel.product_id.push(product_id);
      await cartModel.save();

      return {
        success: true,
        message: "Cart item created",
        cart: cartModel,
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

  async reomoveCartItem(publisher_id: string, product_id: string) {
    try {
      if (!publisher_id) {
        throw new BadRequestException("Login and try again");
      }

      const user = await this.userModel.findById(publisher_id);
      const firstname = user?.first_name;
      const lastname = user?.last_name;

      const productOwner = `${firstname} ${lastname}`;

      const cartItem = await this.cartItemsModel.findOneAndUpdate(
        {publisher_id: publisher_id},
        {$pull: {product_id: product_id}},
        {new: true},
      );

      if (!cartItem) {
        await this.cartItemsModel.create({
          publisher_id: publisher_id,
          product_id: [],
          productOwner: productOwner,
        });
        throw new NotFoundException("Item is not in cart");
      }

      if (publisher_id !== cartItem.publisher_id) {
        throw new ForbiddenException("You did not add this item to the cart");
      }

      console.log("items removed");
      return {
        success: true,
        cartItems: cartItem.product_id,
        message: "Item removed",
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

  async getCartItems(publisher_id: string) {
    try {
      const cartItems = await this.cartItemsModel.findOne({publisher_id});

      if (!cartItems || cartItems.product_id.length === 0) {
        throw new NotFoundException("No items in cart");
      }

      const productIds = cartItems.product_id;

      // Fetch all products for the product IDs in one query
      const products = await this.productModel.find({
        _id: {$in: productIds},
      });

      // Filter valid products and remove invalid product IDs from cart
      const validProducts = products.filter(Boolean);
      const validProductIds = validProducts.map(product =>
        product._id.toString(),
      );
      const invalidProductIds = productIds.filter(
        id => !validProductIds.includes(id),
      );

      // Remove invalid product IDs
      if (invalidProductIds.length) {
        await this.cartItemsModel.updateOne(
          {publisher_id},
          {$pull: {product_id: {$in: invalidProductIds}}},
        );
      }

      if (validProducts.length === 0) {
        return {success: true, message: "No items in cart"};
      }

      // Fetch users in bulk for the publishers of the products
      const userIds = [
        ...new Set(validProducts.map(product => product.publisher_id)),
      ];
      const users = await this.userModel.find({_id: {$in: userIds}});

      // Map user IDs to user data for fast lookup
      const userMap = new Map(users.map(user => [user._id.toString(), user]));

      // Fetch conversion rate once
      const oneNgnInUsd = parseFloat(
        await this.userService.convertNgntoUsd("1"),
      );

      // Map products with user information and calculate USD amount
      const productData = validProducts
        .map(product => {
          const user = userMap.get(product.publisher_id.toString());
          if (user) {
            return {
              id: product._id,
              Title: product.title,
              Amount: product.amount,
              body: product.body,
              From: `${user.first_name} ${user.last_name}`,
              image: product.images,
              usdAmount: product.amount * oneNgnInUsd,
            };
          }
        })
        .filter(Boolean);

      return {success: true, products: productData};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {success: false, message: error.message},
        error.status,
      );
    }
  }

  async getRates(
    orderItems: Array<{id: string; units: number}>,
    user_id: string,
    service_code: string,
  ) {
    try {
      if (!orderItems || orderItems.length === 0) {
        throw new BadRequestException("No order items selected");
      }

      const cartItems = await this.getCartItems(user_id);
      if (!cartItems.products) {
        throw new NotFoundException("No items in cart found");
      }

      // Convert all IDs to string for consistent comparison
      const cartItemIds = new Set(
        cartItems.products.map(product => product.id.toString()),
      );
      const missingOrderItemIds = orderItems
        .filter(orderItem => !cartItemIds.has(orderItem.id.toString()))
        .map(orderItem => orderItem.id);

      if (missingOrderItemIds.length > 0) {
        const missingIdsStr = convertArrayToString(missingOrderItemIds);
        throw new BadRequestException(
          `Items with these ids are not in cart: ${missingIdsStr}`,
        );
      }
      const productIds = orderItems.map(item => item.id);
      const products = await this.productModel.find({_id: {$in: productIds}});
      const productMap = new Map(
        products.map(prod => [prod._id.toString(), prod]),
      );

      // Handle single-item self-shipping scenario
      const singleProduct = products[0];
      if (orderItems.length === 1 && singleProduct?.self_shipping === true) {
        const amount = singleProduct.amount * orderItems[0].units;
        const [amountInUsd, amountInEth] = await Promise.all([
          this.userService.convertNgntoUsd(amount.toString()),
          this.userService.convertNgntoEth(amount.toString()),
        ]);

        const farmer = await this.userModel.findById(
          singleProduct.publisher_id,
        );
        if (!farmer || !farmer.virtual_account_number) {
          throw new BadRequestException(
            "Farmer has not validated BVN or does not exist",
          );
        }

        return {
          success: true,
          product_cost: amount,
          product_cost_in_usd: amountInUsd,
          product_cost_in_eth: amountInEth,
        };
      }

      const itemsToShip = [];
      const selfShippingItems = [];

      for (const item of orderItems) {
        const product = productMap.get(item.id);
        if (product.quantity < item.units) {
          throw new BadRequestException(
            `Product ${product.title} is out of stock`,
          );
        }

        if (product.self_shipping === true) {
          selfShippingItems.push(item);
        } else {
          throw new BadRequestException("Product must be self-shipped");
          const farmer = await this.userModel.findById(product.publisher_id);
          if (!farmer?.virtual_account_number) {
            throw new BadRequestException(
              `Farmer for product ${product.title} has not validated BVN`,
            );
          }
          itemsToShip.push(item);
        }
      }

      // Process items to ship with courier service
      // const shippingItems = await Promise.all(
      //   itemsToShip.map(async item => {
      //     const product = productMap.get(item.id);
      //     const user = await this.userModel.findById(user_id);

      //     if (!user) throw new NotFoundException("User not logged in");

      //     const packageItem = {
      //       name: product.title,
      //       description: product.body,
      //       unit_weight: product.weight,
      //       unit_amount: product.amount,
      //       quantity: item.units,
      //     };

      //     const senderAddressCode =
      //       product.address[product.address.length - 1]?.code;
      //     const receiverAddressCode =
      //       user.address[user.address.length - 1]?.code;

      //     if (!senderAddressCode || !receiverAddressCode) {
      //       throw new BadRequestException(
      //         `Invalid address codes for shipping calculation`,
      //       );
      //     }

      //     const shippingRates = await this.logisticsService.getShippingRates(
      //       service_code,
      //       senderAddressCode,
      //       receiverAddressCode,
      //       packageItem,
      //     );

      //     const fastestCourier = shippingRates.data.fastest_courier;
      //     return {
      //       packageItem,
      //       courier: fastestCourier,
      //       request_token: shippingRates.data.request_token,
      //       shipping_cost: fastestCourier.total,
      //       service_codes: fastestCourier.service_code,
      //       courier_ids: fastestCourier.courier_id,
      //     };
      //   }),
      // );

      // Calculate total shipping and product costs
      // const shippingCosts = shippingItems.map(item => item.shipping_cost);
      // const totalShippingCost = shippingCosts.reduce(
      //   (sum, cost) => sum + cost,
      //   0,
      // );

      const totalProductCost = orderItems.reduce((sum, {id, units}) => {
        const cartProduct = cartItems.products.find(prod => prod.id === id);
        return sum + (cartProduct?.Amount ? units * cartProduct.Amount : 0);
      }, 0);

      const [totalCostInUsd, totalCostInEth] = await Promise.all([
        this.userService.convertNgntoUsd(totalProductCost.toString()),
        this.userService.convertNgntoEth(totalProductCost.toString()),
      ]);

      return {
        //product_cost: totalProductCost,
        shipping_req_token: ["redacted"],
        service_code: ["redacted"],
        total_shipping_cost: totalProductCost,
        courier_id: ["redacted"],
        total_shipping_cost_in_usd: totalCostInUsd,
        total_shipping_cost_in_eth: totalCostInEth,
      };
    } catch (error: any) {
      throw new HttpException(
        {success: false, status: error.status, message: error.message},
        error.status,
      );
    }
  }

  async placeOrder(
    orderItems: Array<{id: string; units: number}>,
    user_id: string,
    service_code: string,
  ) {
    try {
      const rates = await this.getRates(orderItems, user_id, service_code);
      console.log("rates:", rates);

      const totalCost = rates.total_shipping_cost || rates.product_cost;
      console.log("totalcost:", totalCost);

      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new BadRequestException(`User Not found`);
      }

      let balance = (await this.userService.getUserBalance(user_id)).balance;
      console.log("Balance Gotten");
      //@ts-ignore
      balance = parseFloat(balance);
      if (balance < totalCost) {
        throw new BadRequestException(
          `Insufficient balance fund wallet and try again`,
        );
      }
      for (const item of orderItems) {
        const product = await this.productModel.findById(item.id);
        if (!product)
          throw new BadRequestException(`Item ${item.id} not found`);

        const farmer = await this.userModel.findById(product.publisher_id);
        if (!farmer)
          throw new BadRequestException(
            `Farmer ${product.publisher_id} not found`,
          );
        if (!farmer)
          throw new BadRequestException(
            `Owner of product ${product.title} does not exist`,
          );
        if (
          !farmer.virtual_account_number ||
          farmer.virtual_account_number.length < 1
        )
          throw new BadRequestException(
            `Farmer ${farmer.first_name} ${farmer.last_name} has not validated bvn`,
          );
      }

      const getIds = (data: Array<{id: string; units: number}>): string => {
        const ids = data.map(item => item.id);
        return ids.join(", ");
      };

      const transfer = await this.userService.transferToEscrowFromUser(
        totalCost.toString(),
        user_id,
      );
      const transactions = await this.transactionsModel.findOne({
        userId: user.id,
      });
      if (!transactions) {
        await this.transactionsModel.create({
          userId: user.id,
          transactions: [
            {
              Type: "ORDER DEBIT", // Represents debits from orders
              Session_Id: generateRandomString(),
              AmountSent: totalCost.toString(),
              status: transfer.status,
              AmountSettled: totalCost.toString(),
              productId: getIds(orderItems),
            },
          ],
        });
      } else {
        const transactionObject = {
          Session_id: generateRandomString(),
          Type: "ORDER DEBIT" as const, // Represents debits from orders
          AmountSent: totalCost,
          status: transfer.status as "SUCCESS" | "FAILED" | "PENDING",
          AmountSettled: totalCost,
          productId: getIds(orderItems),
          Time: new Date().toISOString(),
        };
        transactions.transactions.push(transactionObject);
        await transactions.save();
      }

      const shipping_req_token = rates.shipping_req_token || [];
      const service_codes = rates.service_code || [];

      const courier_ids = rates.courier_id || [];
      const itemsToShip = [];
      const itemsNotToShip = [];
      for (const item of orderItems) {
        const product = await this.productModel.findById(item.id);
        if (product?.self_shipping === false) {
          itemsToShip.push(item);
        } else {
          itemsNotToShip.push(item);
        }
      }

      if (itemsToShip.length > 0) {
        // Create a mapping of itemId to index in the itemsToShip array
        const itemIdToIndexMap = new Map();
        itemsToShip.forEach((item, index) => {
          itemIdToIndexMap.set(item.id, index);
        });

        const orderItemsPromise = itemsToShip.map(async item => {
          const product = await this.productModel.findById(item.id);
          if (!product) throw new NotFoundException("Product not found");
          const index = itemIdToIndexMap.get(item.id);
          if (index !== undefined) {
            const req_token = shipping_req_token[index];
            const code = service_codes[index];
            const courier_id = courier_ids[index];
            const shipment = await this.logisticsService.createShipment(
              req_token,
              code,
              courier_id,
            );
            this.userMailerService.notSelfShipOrderSuccessMail(
              user,
              shipment.data.tracking_url,
              product,
              item.units,
              totalCost,
            );
            const farmerId = product.publisher_id;
            const farmer = await this.userModel.findById(farmerId);
            if (!farmer) return;
            this.userMailerService.notSelfShipmentMail(
              farmer.email,
              product,
              user,
              item.units,
            );
            await this.reomoveCartItem(user_id, item.id);
            this.eventEmitter.emit("Products Shipped", {
              product_id: product.id,
              buyer_address:
                "3UsPQ4MxhGNLEbYac53H7C2JHzE3Xe41zrgCdLVrp5vphx4YSe",
              buyer_id: user_id,
              amount: product.amount.toString(),
            });
            await this.orderService.createOutgoingOrder(
              item.id,
              farmer.id,
              user_id,
              item.units,
              shipment.data.order_id,
              "WEB2",
            );
            await this.orderService.createIncomingOrder(
              item.id,
              farmer.id,
              user.id,
              item.units,
              shipment.data.order_id,
              "WEB2",
            );
            product.quantity -= 1;
            await product.save();
            console.log(shipment.data.order_id);
            console.log(shipment.data);

            return shipment.data;
          } else {
            return null;
          }
        });

        const resolvedShipments = await Promise.all(orderItemsPromise);
      }

      if (itemsNotToShip.length > 0) {
        itemsNotToShip.map(async item => {
          const product = await this.productModel.findById(item.id);
          if (!product) {
            throw new NotFoundException("Product not found");
          }
          const farmerId = product.publisher_id;
          const farmer = await this.userModel.findById(farmerId);
          if (!farmer) {
            throw new NotFoundException("User may have deleted their account");
          }

          this.eventEmitter.emit("Products Not Shipped", {
            product_id: product.id,
            buyer_address: "3UsPQ4MxhGNLEbYac53H7C2JHzE3Xe41zrgCdLVrp5vphx4YSe",
            buyer_id: user_id,
            amount: product.amount.toString(),
          });

          this.userMailerService.selfShipmentMail(
            farmer.email,
            product,
            user,
            item.units,
          );
          this.userMailerService.selfShipOrderSuccessMail(
            user,
            product,
            item.units,
            totalCost,
          );
          await this.reomoveCartItem(user_id, item.id);
          const abbr = getAbbreviation(`${farmer.first_name} ${product.title}`);
          const rn = generateRandomSixDigitNumber();
          await this.orderService.createOutgoingOrder(
            item.id,
            farmer.id,
            user_id,
            item.units,
            `${abbr}${rn}`,
            "WEB2",
          );
          await this.orderService.createIncomingOrder(
            item.id,
            farmer.id,
            user.id,
            item.units,
            `${abbr}${rn}`,
            "WEB2",
          );
          product.quantity -= 1;
          await product.save();
        });
      }

      return {
        success: true,
        message: "Orders Placed Successfully",
      };
    } catch (error: any) {
      console.log(error);

      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async payWithEth(
    orderItems: Array<{id: string; units: number}>,
    user_id: string,
    service_code: string,
  ) {
    try {
      const rates = await this.getRates(orderItems, user_id, service_code);
      let totalCostInNgn: number;
      if (!rates.total_shipping_cost) {
        totalCostInNgn = rates.product_cost;
      } else {
        totalCostInNgn = rates.total_shipping_cost + rates.product_cost;
      }
      console.log(totalCostInNgn);

      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new BadRequestException(`User Not found`);
      }

      const ethBalanceInNgn = parseInt(
        await this.userService.convertEthToNgn(user.arbitrum_wallet),
      );
      console.log(`ethbalanceinngng:${ethBalanceInNgn}`);
      if (ethBalanceInNgn < totalCostInNgn) {
        throw new BadRequestException(
          `Insufficient eth balance, fund wallet and try again`,
        );
      }
      const provider = new providers.JsonRpcProvider(
        "https://sepolia-rollup.arbitrum.io/rpc",
      );

      const buyerWallet = new ethers.Wallet(user.arbitrumPrivateKey, provider);
      const marketplaceAddr = "0x523E1E3E3c052cf87ac12D08d58F59b22f2852F2";
      const contract = new ethers.Contract(marketplaceAddr, abi, buyerWallet);

      const newBalance = ethBalanceInNgn - totalCostInNgn;
      const newEthBalance = await this.userService.convertNgntoArb(
        newBalance.toString(),
      );
      user.arbitrum_wallet = newEthBalance;
      await user.save();
      const shipping_req_token = rates.shipping_req_token || [];
      const service_codes = rates.service_code || [];

      const courier_ids = rates.courier_id || [];
      const itemsToShip = [];
      const itemsNotToShip = [];
      for (const item of orderItems) {
        const product = await this.productModel.findById(item.id);
        if (product.quantity < 1) {
          throw new BadRequestException(
            `Product: ${product.title} is out of stock`,
          );
        }
        if (product?.self_shipping === false) {
          itemsToShip.push(item);
        } else {
          itemsNotToShip.push(item);
        }
      }
      console.log(itemsToShip);

      if (itemsToShip.length > 0) {
        // Create a mapping of itemId to index in the itemsToShip array
        const itemIdToIndexMap = new Map();
        itemsToShip.forEach((item, index) => {
          itemIdToIndexMap.set(item.id, index);
        });

        const orderItemsPromise = itemsToShip.map(async item => {
          console.log(item.id);
          const product = await this.productModel.findById(item.id);
          if (!product) throw new NotFoundException("Product not found");
          const index = itemIdToIndexMap.get(item.id);
          if (index !== undefined) {
            const req_token = shipping_req_token[index];
            const code = service_codes[index];
            const courier_id = courier_ids[index];
            const shipment = await this.logisticsService.createShipment(
              req_token,
              code,
              courier_id,
            );
            const ethAmount = await this.userService.convertNgntoEth(
              product.amount.toString(),
            );
            const roundedEthAmount = this.userService.roundToSignificantFigures(
              parseFloat(ethAmount),
              4,
            );
            // const decimals = (ethAmount.split(".")[1] || []).length;
            const parsedEthAmount = ethers.utils.parseEther(
              roundedEthAmount.toString(),
            );
            const order = await contract.orderProduct(
              product.id,
              parsedEthAmount,
              user_id,
              {
                value: parsedEthAmount,
                gasLimit: 500000,
              },
            );

            const tx = await order.wait();
            console.log(order);
            console.log(tx);
            this.userMailerService.notSelfShipOrderSuccessMail(
              user,
              shipment.data.tracking_url,
              product,
              item.units,
              totalCostInNgn,
            );
            const farmerId = product.publisher_id;
            const farmer = await this.userModel.findById(farmerId);
            if (!farmer) return;
            await this.reomoveCartItem(user_id, item.id);
            product.quantity -= 1;
            await product.save();
            await this.orderService.createOutgoingOrder(
              item.id,
              farmer.id,
              user_id,
              item.units,
              shipment.data.order_id,
              "ETH",
            );
            await this.orderService.createIncomingOrder(
              item.id,
              farmer.id,
              user.id,
              item.units,
              shipment.data.order_id,
              "ETH",
            );
            this.userMailerService.notSelfShipmentMail(
              farmer.email,
              product,
              user,
              item.units,
            );

            this.eventEmitter.emit("Products Shipped", {
              product_id: product.id,
              buyer_address:
                "3UsPQ4MxhGNLEbYac53H7C2JHzE3Xe41zrgCdLVrp5vphx4YSe",
              buyer_id: user_id,
              amount: product.amount.toString(),
            });

            return shipment.data;
          } else {
            return null;
          }
        });

        const resolvedShipments = await Promise.all(orderItemsPromise);
        console.log(resolvedShipments);
      }

      if (itemsNotToShip.length > 0) {
        await Promise.all(
          itemsNotToShip.map(async item => {
            const product = await this.productModel.findById(item.id);
            if (!product) {
              throw new NotFoundException("Product not found");
            }
            const farmerId = product.publisher_id;
            const farmer = await this.userModel.findById(farmerId);
            if (!farmer) {
              throw new NotFoundException(
                "User may have deleted their account",
              );
            }

            const ethAmount = await this.userService.convertNgntoEth(
              product.amount.toString(),
            );
            const roundedEthAmount = this.userService.roundToSignificantFigures(
              parseFloat(ethAmount),
              4,
            );
            console.log(`eth AMounttoship:${roundedEthAmount}`);
            //  const decimals = (ethAmount.split(".")[1] || []).length;
            const parsedEthAmount = ethers.utils.parseEther(
              roundedEthAmount.toString(),
            );

            const order = await contract.orderProduct(
              product.id,
              product.amount,
              user_id,
              {
                value: parsedEthAmount,
                gasLimit: 500000,
              },
            );

            const tx = await order.wait();
            console.log(order);
            console.log(tx);

            await this.reomoveCartItem(user_id, item.id);
            product.quantity -= 1;
            await product.save();
            this.eventEmitter.emit("Products Not Shipped", {
              product_id: product.id,
              buyer_address:
                "3UsPQ4MxhGNLEbYac53H7C2JHzE3Xe41zrgCdLVrp5vphx4YSe",
              buyer_id: user_id,
              amount: product.amount.toString(),
            });
            const abbr = getAbbreviation(
              `${farmer.first_name} ${product.title}`,
            );
            const rn = generateRandomSixDigitNumber();
            await this.orderService.createOutgoingOrder(
              item.id,
              farmer.id,
              user_id,
              item.units,
              `${abbr}${rn}`,
              "ETH",
            );
            await this.orderService.createIncomingOrder(
              item.id,
              farmer.id,
              user.id,
              item.units,
              `${abbr}${rn}`,
              "ETH",
            );
            this.userMailerService.selfShipmentMail(
              farmer.email,
              product,
              user,
              item.units,
            );
            this.userMailerService.selfShipOrderSuccessMail(
              user,
              product,
              item.units,
              totalCostInNgn,
            );
          }),
        );
      }

      return {
        success: true,
        message: "Orders Placed Successfully",
      };
    } catch (error: any) {
      console.log(error);

      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.reason || error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async payWithCCd(
    orderItems: Array<{id: string; units: number}>,
    user_id: string,
    service_code?: string,
  ) {
    try {
      // const rates = await this.getRates(orderItems, user_id, service_code);
      // let totalCostInNgn: number;
      // if (!rates.total_shipping_cost) {
      //   totalCostInNgn = rates.product_cost;
      // } else {
      //   totalCostInNgn = rates.total_shipping_cost + rates.product_cost;
      // }
      await this.userService.getCcdWalletBalance(user_id);
      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new BadRequestException(`Invalid Token`);
      }
      const rates = (await this.getRates(orderItems, user_id, service_code))
        .product_cost;
      const ccdRate = Math.round(
        await this.userService.convertNgntoCcd(rates.toString()),
      );

      if (parseFloat(user.ccd_wallet) < ccdRate) {
        throw new BadRequestException("Insufficient ccd balance");
      }
      for (const item of orderItems) {
        const product = await this.productModel.findById(item.id);
        if (product) {
          const farmer = await this.userModel.findById(product.publisher_id);
          if (farmer) {
            const ccdCost = parseFloat(
              await this.userService.convertNgntoCcd(product.amount.toString()),
            );
            const roundedCost = Math.round(ccdCost);
            console.log("ccd cost", ccdCost);
            console.log("rounded cost", roundedCost);

            const abbr = getAbbreviation(
              `${farmer.first_name} ${product.title}`,
            );
            const rn = generateRandomSixDigitNumber();
            await this.ccdService.pay(
              roundedCost,
              farmer.ccd_wallet_address,
              user.id,
              `${abbr}${rn}`,
            );
            await this.reomoveCartItem(user_id, item.id);
            product.quantity -= 1;
            await product.save();

            await this.orderService.createOutgoingOrder(
              item.id,
              farmer.id,
              user_id,
              item.units,
              `${abbr}${rn}`,
              "CCD",
            );
            await this.orderService.createIncomingOrder(
              item.id,
              farmer.id,
              user.id,
              item.units,
              `${abbr}${rn}`,
              "CCD",
            );
            this.userMailerService.selfShipmentMail(
              farmer.email,
              product,
              user,
              item.units,
            );
            this.userMailerService.selfShipOrderSuccessMail(
              user,
              product,
              item.units,
              product.amount,
            );
          }
        }
      }
      return {
        success: true,
        message: "Products Ordered",
      };
    } catch (error: any) {
      console.log(error);

      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.reason || error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async validateUserAddressForItemsInCart(
    name: string,
    email: string,
    phone: string,
    address: string,
    userId: string,
  ) {
    try {
      const cartItems = await this.cartItemsModel.findOne({
        publisher_id: userId,
      });
      if (!cartItems) throw new BadRequestException("Cart is empty");
      const selfShippingProducts = [];
      const productIds = cartItems.product_id;
      const numOfproducts = productIds.length;

      for (const productId of productIds) {
        const product = await this.productModel.findById(productId);
        if (!product) return;
        if (product.self_shipping === true) {
          selfShippingProducts.push(productId);
        }
      }
      if (numOfproducts === selfShippingProducts.length) {
        return {
          success: true,
          message: "Validation Success",
        };
      }
      const url = `${base_url}/shipping/address/validate`;
      const data = {name: name, email: email, phone: phone, address: address};
      console.log(data);

      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        throw new BadRequestException(`${res.data.message}`);
      }
      const response = res.data.data;

      const user = await this.userModel.findOne({email: email});

      const addressExists = user?.address.find(
        (address: any) => address.address === response.formatted_address,
      );
      const addressData = {
        address: response.formatted_address,
        code: response.address_code,
      };

      if (!addressExists) {
        user?.address.push(addressData);
        await user?.save();
      }

      return {success: true, data: response};
    } catch (error: any) {
      console.log(error);

      throw new HttpException(
        {
          success: false,
          message: error.response.data.message || error.message,
        },
        error.response.status || error.status,
      );
    }
  }
}
