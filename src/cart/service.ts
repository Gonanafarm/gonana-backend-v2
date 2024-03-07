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
import {TransactionDocument} from "src/user/transaction.schema";
const abi = require("../../abi.json");

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
      // if (product.quantity < 1) {
      //   return { success: false, message: "Product is out of stock"};
      // }
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
      const cartItems = await this.cartItemsModel.findOne({
        publisher_id: publisher_id,
      });
      if (!cartItems) {
        throw new NotFoundException(`No items in cart`);
      }
      const productIds = cartItems.product_id;
      if (productIds.length < 1) {
        throw new NotFoundException(`No items in cart`);
      }

      // Filter out invalid productIds that don't return a product
      const validProductIds = [];
      for (const productId of productIds) {
        const product = await this.productModel.findById(productId);
        if (product) {
          validProductIds.push(productId);
        } else {
          await this.reomoveCartItem(publisher_id, productId);
        }
      }

      // Update cartItems with validProductIds
      cartItems.product_id = validProductIds;
      await cartItems.save();

      const productPromises = validProductIds.map(async productId => {
        const product = await this.productModel.findById(productId);
        const user_id = product?.publisher_id;
        const user = await this.userModel.findById(user_id);
        const usdAmount = await this.userService.convertNgntoUsd(
          product?.amount.toString() as string,
        );

        if (product && user)
          return {
            id: product?.id,
            Title: product?.title,
            Amount: product?.amount,
            body: product?.body,
            From: `${user?.first_name} ${user?.last_name}`,
            image: product?.images,
            usdAmount: usdAmount,
          };
      });

      const products = await Promise.all(productPromises);

      const foundProducts = products.filter(product => !!product);
      if (foundProducts.length < 1) {
        return {success: true, message: "No items in cart"};
      }

      return {success: true, products: foundProducts};
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

  async getRates(
    orderItems: Array<{id: string; units: number}>,
    user_id: string,
    service_code: string,
  ) {
    try {
      if (!orderItems || orderItems.length === 0) {
        throw new BadRequestException(`No order items selected`);
      }

      const cartItems = await this.getCartItems(user_id);
      if (!cartItems.products) {
        throw new NotFoundException(`No items in cart found`);
      }
      const cartItemIds = cartItems.products.map(product => {
        return product?.id;
      });
      const missingOrderItemIds = orderItems
        .filter(orderItem => !cartItemIds.includes(orderItem.id))
        .map(orderItem => orderItem.id);

      if (missingOrderItemIds.length > 0) {
        // Handle the missing order item IDs, you can throw an exception or handle them as needed
        const strings = convertArrayToString(missingOrderItemIds);

        throw new BadRequestException(
          `Items with these ids are not in cart ${strings}`,
        );
      }

      const product = await this.productModel.findById(orderItems[0].id);
      if (!product) {
        throw new NotFoundException("Product Not Found");
      }
      // Check if there's only one item left and it's self-shipping
      if (orderItems.length === 1 && product?.self_shipping === true) {
        const amount = product.amount * orderItems[0].units;
        const amountInUsd = await this.userService.convertNgntoUsd(
          amount.toString(),
        );
        return {
          success: true,
          product_cost: amount,
          product_cost_in_usd: amountInUsd,
        };
      }

      const itemsToShip = [];
      for (const item of orderItems) {
        const product = await this.productModel.findById(item.id);
        if (product?.self_shipping === false) {
          itemsToShip.push(item);
        }
      }
      const itemsToShipPromises = itemsToShip.map(async (item: any) => {
        const productId = item.id;
        const product = await this.productModel.findById(productId);
        const user = await this.userModel.findById(user_id);
        if (!user) {
          throw new NotFoundException("User Not Logged in");
        }
        // Check if the product has self_shipping set to true and skip it
        if (!product) {
          return null;
        }
        if (product && product.self_shipping === true) {
          return null;
        }

        const packageItem = {
          name: product?.title,
          description: product?.body,
          unit_weight: product?.weight,
          unit_amount: product?.amount,
          quantity: item.units,
        };

        const productLength = product.address.length;
        const productIndex = productLength - 1;
        const sender_address_code =
          product.address[productIndex].code || undefined;
        console.log(product.address);

        if (sender_address_code === undefined) {
          throw new BadRequestException("farmer does not have a valid address");
        }
        const userLength = user.address.length;
        const userIndex = userLength - 1;
        const receiver_address_code = user.address[userIndex].code || undefined;

        if (receiver_address_code === undefined) {
          throw new BadRequestException("user does not have a valid address");
        }
        const shippingRates = await this.logisticsService.getShippingRates(
          service_code,
          sender_address_code,
          receiver_address_code,
          packageItem,
        );
        const courier = shippingRates.data.fastest_courier;
        const request_token = shippingRates.data.request_token;
        const shipping_cost = shippingRates.data.fastest_courier.total;
        const courier_ids = shippingRates.data.fastest_courier.courier_id;
        const service_codes = shippingRates.data.fastest_courier.service_code;
        return {
          packageItem,
          courier,
          request_token,
          shipping_cost,
          service_codes,
          courier_ids,
        };
      });

      // Filter out any skipped products
      const filteredItemsToShipPromises = itemsToShipPromises.filter(
        item => item !== null,
      );

      const couriers = await Promise.all(filteredItemsToShipPromises);
      const cartItemMap = new Map(
        cartItems.products?.map(item => [item?.id, item]),
      );
      const request_tokens = couriers.map(item => item?.request_token);

      const courier_id = couriers.map(item => item?.courier_ids);

      const service_codes = couriers.map(item => item?.service_codes);

      const shipping_cost = couriers.map(item => item?.shipping_cost);
      const sumArrayNumbers = (numbers: number[]): number => {
        return numbers.reduce((total, num) => total + num, 0);
      };
      const total_shipping_cost = sumArrayNumbers(shipping_cost);

      // Calculate the total amount
      const totalAmount = orderItems.reduce((sum, orderItem) => {
        const cartItem = cartItemMap.get(orderItem.id);
        if (cartItem) {
          //@ts-ignore
          return sum + orderItem.units * cartItem.Amount;
        }
        return sum;
      }, 0);

      const total_shipping_cost_in_usd = await this.userService.convertNgntoUsd(
        (totalAmount + total_shipping_cost).toString(),
      );

      return {
        product_cost: totalAmount,
        shipping_req_token: request_tokens,
        service_code: service_codes,
        total_shipping_cost: total_shipping_cost,
        courier_id: courier_id,
        total_shipping_cost_in_usd: total_shipping_cost_in_usd,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          status: error.status,
          message: error.message,
        },
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
      //@ts-ignore
      let totalCost: number;
      if (!rates.total_shipping_cost) {
        totalCost = rates.product_cost;
      } else {
        totalCost = rates.total_shipping_cost + rates.product_cost;
      }

      const user = await this.userModel.findById(user_id);
      if (!user) {
        throw new BadRequestException(`User Not found`);
      }
      //@ts-ignore
      const balance = parseInt(user.balance);

      if (balance < totalCost) {
        throw new BadRequestException(
          `Insufficient balance fund wallet and try again`,
        );
      }
      const newBalance = balance - totalCost;
      user.balance = newBalance;
      await user.save();

      const getIds = (data: Array<{id: string; units: number}>) => {
        const ids = data.map(item => item.id);
        return ids.join(", ");
      };

      const transactions = await this.transactionsModel.findOne({
        userId: user.id,
      });
      if (!transactions) {
        await this.transactionsModel.create({
          userId: user.id,
          transactions: [
            {
              Type: "ORDER DEBIT",
              AmountSent: totalCost.toString(),
              AmountSettled: totalCost.toString(),
              productId: getIds(orderItems),
            },
          ],
        });
      } else {
        const transactionObject = {
          Type: "DEBIT",
          AmountSent: totalCost,
          AmountSettled: totalCost,
          productId: getIds(orderItems),
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
        });
      }

      return {
        success: true,
        message: "Orders Placed Successfully",
      };
    } catch (error: any) {
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
      console.log(rates);
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
        await this.userService.convertEthToNgn(user.wallet),
      );

      if (ethBalanceInNgn < totalCostInNgn) {
        throw new BadRequestException(
          `Insufficient eth balance, fund wallet and try again`,
        );
      }
      const provider = new providers.JsonRpcProvider(
        "https://rpc.ankr.com/blast_testnet_sepolia",
      );

      const buyerWallet = new ethers.Wallet(user.privateKey, provider);
      const marketplaceAddr = "0x686690ef4a57F11A4980e0053E2D1EdD69782F35";
      const contract = new ethers.Contract(marketplaceAddr, abi, buyerWallet);

      const newBalance = ethBalanceInNgn - totalCostInNgn;
      const newEthBalance = await this.userService.convertNgntoEth(
        newBalance.toString(),
      );
      user.wallet = newEthBalance;
      await user.save();
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
            const decimals = (ethAmount.split(".")[1] || []).length;
            const parsedEthAmount = ethers.utils.parseEther(ethAmount);
            const order = await contract.orderProduct(
              product.id,
              parsedEthAmount,
              user_id,
              {
                value: parsedEthAmount,
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
            const decimals = (ethAmount.split(".")[1] || []).length;
            const parsedEthAmount = ethers.utils.parseEther(
              ethAmount as string,
            );

            const order = await contract.orderProduct(
              product.id,
              parsedEthAmount,
              user_id,
              {
                value: parsedEthAmount,
                gasLimit: 50000,
              },
            );

            const tx = await order.wait();
            console.log(order);
            console.log(tx);

            await this.reomoveCartItem(user_id, item.id);

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
}
