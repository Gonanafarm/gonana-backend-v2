/* eslint-disable no-useless-catch */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import {Model} from "mongoose";
import {OrderDocument} from "./outgoing.order.schema";
import {Post, PostDocument} from "../post/post.schema";
import { UserDocument} from "../user/user.schema";
import {IncomingOrderDocument} from "./incoming.order.schema";
import {UserMailerService} from "../user/user.mailer.service";
const now = new Date(); // Get the current date and time in UTC
@Injectable()
export class OrderService {
  //@ts-ignore
  constructor(
    //@ts-ignore
    @InjectModel("OUTGOING_ORDERS")
    private outgoingOrderModel: Model<OrderDocument>,
    //@ts-ignore
    @InjectModel(Post.name) private productModel: Model<PostDocument>,
    //@ts-ignore
    @InjectModel("User") private userModel: Model<UserDocument>,
    //@ts-ignore
    @InjectModel("INCOMING_ORDERS")
    private incomingOrderModel: Model<IncomingOrderDocument>,
    private userMailerService: UserMailerService,
  ) {}

  async createOutgoingOrder(
    product_id: string,
    farmer_id: string,
    customer_id: string,
    quantity: number,
    shipbubble_id: string,
    payment_method: "WEB2" | "WEB3",
  ) {
    const farmer = await this.userModel.findById(farmer_id);
    if (!farmer) {
      throw new BadRequestException("User not found");
    }

    const product = await this.productModel.findById(product_id);
    if (!product) return;

    const order = await this.outgoingOrderModel.create({
      farmer_id: farmer.id,
      product_name: product.title,
      quantity: quantity,
      payment_method: payment_method,
      image: product.images,
      product_id: product.id,
      product_amount: product.amount,
      shipbubble_id: shipbubble_id,
      customer_id: customer_id,
      product_description: product.body,
      self_shipping: product.self_shipping,
    });
    console.log(order);
    return order;
  }

  async createIncomingOrder(
    product_id: string,
    farmer_id: string,
    customer_id: string,
    quantity: number,
    shipbubble_id: string,
    payment_method: "WEB2" | "WEB3",
  ) {
    const customer = await this.userModel.findById(customer_id);
    if (!customer) {
      throw new BadRequestException("User not found");
    }

    const farmer = await this.userModel.findById(farmer_id);
    if (!farmer) {
      throw new BadRequestException("Famer not found");
    }

    const product = await this.productModel.findById(product_id);
    if (!product) return;

    const order = await this.incomingOrderModel.create({
      customer_id: customer.id,
      product_name: product.title,
      quantity: quantity,
      payment_method: payment_method,
      image: product.images,
      farmer_id: farmer_id,
      product_id: product.id,
      product_amount: product.amount,
      shipbubble_id: shipbubble_id,
      product_description: product.body,
      self_shipping: product.self_shipping,
    });
    console.log(order);
    return order;
  }

  async getIncomingOrders(customerId: string) {
    try {
      const customer = await this.userModel.findById(customerId);
      if (!customer) {
        throw new BadRequestException("User not found");
      }

      const orders = await this.incomingOrderModel
        .find({
          customer_id: customer.id,
        })
        .sort({created_at: -1}); // Add this line to sort in LIFO order

      if (orders.length < 1) {
        throw new BadRequestException("No incoming orders found");
      }
      return {
        success: true,
        data: orders,
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

  async getOutgoingOrders(customerId: string) {
    try {
      const customer = await this.userModel.findById(customerId);
      if (!customer) {
        throw new BadRequestException("User not found");
      }

      const orders = await this.outgoingOrderModel
        .find({
          farmer_id: customer.id,
        })
        .sort({created_at: -1}); // Add this line to sort in LIFO order

      if (orders.length < 1) {
        throw new BadRequestException("No outgoing orders found");
      }
      return {
        success: true,
        data: orders,
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

  async handleWebhook(payload: any) {
    const farmerEmail = payload.ship_from.email;
    const farmer = await this.userModel.findOne({email: farmerEmail});
    if (!farmer) {
      return;
    }

    const customerEmail = payload.ship_to.email;
    const customer = await this.userModel.findOne({
      email: customerEmail,
    });
    if (!customer) {
      return;
    }

    const trackingUrl = payload.tracking_url;
    const orderId = payload.order_id;

    const incomingOrder = await this.incomingOrderModel.findOne({
      shipbubble_id: orderId,
    });
    if (!incomingOrder) return;
    const outgoingOrder = await this.outgoingOrderModel.findOne({
      shipbubble_id: payload.order_id,
    });
    if (!outgoingOrder) return;
    if (payload.event === "shipment.cancelled") {
      this.userMailerService.orderCancelledCustomerMail(
        customerEmail,
        payload.ship_from.name,
        payload.ship_from.address,
        payload.ship_from.phone,
        orderId,
      );
      this.userMailerService.orderCancelledFarmerMail(
        farmerEmail,
        payload.ship_to.name,
        payload.ship_to.address,
        payload.ship_to.phone,
        orderId,
      );
      return;
    }

    if (payload.event === "shipment.status.changed") {
      if (payload.status === "picked_up") {
        incomingOrder.status = "picked_up_from_farmer";
        await incomingOrder.save();
        this.userMailerService.customerOrderStatusChangedMail(
          customerEmail,
          payload.order_id,
          "picked up from farmer",
          trackingUrl,
        );

        outgoingOrder.status = "picked_up_from_farmer";
        await outgoingOrder.save();

        this.userMailerService.farmerOrderStatusChangedMail(
          farmerEmail,
          orderId,
          "picked up from farmer",
          trackingUrl,
        );
      } else {
        incomingOrder.status = payload.status;
        await incomingOrder.save();
        this.userMailerService.customerOrderStatusChangedMail(
          customerEmail,
          payload.order_id,
          payload.status,
          trackingUrl,
        );
        outgoingOrder.status = payload.status;
        await outgoingOrder.save();
        this.userMailerService.farmerOrderStatusChangedMail(
          farmerEmail,
          orderId,
          payload.status,
          trackingUrl,
        );
      }

      if (payload.status === "completed") {
        this.userMailerService.customerOrderCompletedMail(
          customerEmail,
          orderId,
          payload.ship_from.phone,
        );

        this.userMailerService.farmerOrderCompletedMail(farmerEmail, orderId);
        const farmerPatrons = farmer.patrons;

        const reducedProductCost = incomingOrder.product_amount * 0.975; // reduce by 2.5%

        const newBalance = farmer.balance + reducedProductCost;

        farmer.balance = newBalance;
        await farmer.save();

        console.log(customer.onesignal_id);

        if (farmerPatrons.includes(customer.onesignal_id as string)) {
          return;
        } else {
          farmer.patrons.push(customer.onesignal_id as string);
          console.log(farmer.patrons);

          await farmer.save();
        }
      }

      if (payload.status !== "completed" && "picked_up") {
        incomingOrder.status = payload.status;
        await incomingOrder.save();
        outgoingOrder.status = payload.status;
        await outgoingOrder.save();
      }
    }
  }
  async confirmOutgoingOrderSent(orderId: string, farmerId: string) {
    if (!orderId) {
      throw new BadRequestException("Must provide orderId");
    }
    const outgoingOrder = await this.outgoingOrderModel.findById(orderId);
    if (!outgoingOrder) {
      throw new NotFoundException("Order not found");
    }
    if (farmerId !== outgoingOrder.farmer_id) {
      throw new BadRequestException("This is not your order");
    }
    if (outgoingOrder.self_shipping === false) {
      throw new BadRequestException(
        "Shipment of this product is not handled by you",
      );
    }

    if (outgoingOrder.farmer_ship_date !== undefined) {
      throw new BadRequestException(
        "You have already confirmed this order has been shipped",
      );
    }
    outgoingOrder.farmer_shipped = true;
    outgoingOrder.farmer_ship_date = new Date(
      now.getTime() + 1 * 60 * 60 * 1000,
    );

    await outgoingOrder.save();

    const incomingOrder = await this.incomingOrderModel.findOne({
      shipbubble_id: outgoingOrder.shipbubble_id,
    });
    if (!incomingOrder) {
      console.log("here");

      return;
    }
    incomingOrder.farmer_shipped = true;
    incomingOrder.farmer_ship_date = new Date(
      now.getTime() + 1 * 60 * 60 * 1000,
    );
    await incomingOrder.save();

    return {
      success: true,
      data: outgoingOrder,
    };
  }

  async confirmIncomingOrderReceived(orderId: string, customerId: string) {
    if (!orderId) {
      throw new BadRequestException("Must provide orderId");
    }

    const incomingOrder = await this.incomingOrderModel.findById(orderId);
    if (!incomingOrder) {
      throw new NotFoundException("Order not found");
    }

    const farmer = await this.userModel.findById(incomingOrder.farmer_id);
    if (!farmer) {
      throw new BadRequestException("Farmer may have deleted their account");
    }
    const customer = await this.userModel.findById(incomingOrder.customer_id);
    if (!customer) {
      throw new BadRequestException("This is not your order");
    }

    if (customerId !== incomingOrder.customer_id) {
      throw new BadRequestException("This is not your order");
    }
    if (incomingOrder.farmer_shipped === false) {
      throw new BadRequestException("Farmer has not sent out this product");
    }
    incomingOrder.customer_received = true;

    incomingOrder.customer_received_date = new Date(
      now.getTime() + 1 * 60 * 60 * 1000,
    ); // Convert to the local time in West Africa Time (WAT is UTC+1) and save

    incomingOrder.status = "completed";

    await incomingOrder.save();

    const outgoingOrder = await this.outgoingOrderModel.findOne({
      shipbubble_id: incomingOrder.shipbubble_id,
    });
    if (!outgoingOrder) {
      return;
    }
    outgoingOrder.customer_received = true;
    outgoingOrder.customer_received_date = new Date(
      now.getTime() + 1 * 60 * 60 * 1000,
    );
    outgoingOrder.status = "completed";
    await outgoingOrder.save();
    this.userMailerService.farmerOrderCompletedMail(
      farmer.email,
      incomingOrder.shipbubble_id,
    );
    this.userMailerService.customerOrderCompletedMail(
      customer.email,
      incomingOrder.shipbubble_id,
      farmer.phone,
    );
    return {
      success: true,
      data: incomingOrder,
    };
  }

  async complaint(
    orderId: string,
    complaint: string,
    userId: string,
    subject: string,
  ) {
    if (!orderId) {
      throw new BadRequestException({
        success: false,
        message: "Must provide orderId",
      });
    }
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new BadRequestException({
        success: false,
        message: "User not found",
      });
    }
    const incomingOrder = await this.incomingOrderModel.findById(orderId);
    if (!incomingOrder) {
      throw new NotFoundException({success: false, message: "Order not found"});
    }
    if (incomingOrder.customer_id !== user.id) {
      throw new BadRequestException({
        success: false,
        message: "This is not your order",
      });
    }

    if (incomingOrder.farmer_shipped === false) {
      throw new BadRequestException({
        success: false,
        message: "Farmer has not sent out the item",
      });
    }
    this.userMailerService.complaint(user.first_name, subject, complaint);
    return {
      success: true,
      message: "Complaint has been forwarded to our customer service",
    };
  }
}
