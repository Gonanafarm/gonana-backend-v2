import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import axios from "axios";
import {CartItemService} from "./service";
const abi = require("../../abi.json");
import {ethers} from "ethers";

@Injectable()
export class CartEventHandler {
  constructor(private cartService: CartItemService) {}

  @OnEvent("Products Not Shipped")
  async handleChainEvent(payload: any) {
    console.log("event triggered");
    console.log(payload);

    const res = await axios.post(
      "https://gonana-market.onrender.com/order",
      payload,
    );
    console.log(res.data);
  }
  @OnEvent("Product Shipped")
  async handleEvent(payload: any) {
    console.log("event triggered");
    console.log(payload);

    const res = await axios.post(
      "https://gonana-market.onrender.com/order",
      payload,
    );
    console.log(res.data);
  }
  @OnEvent("Blast Ship Trigger")
  async handleBlastShipEvent(payload: any) {
    const marketplaceAddr = "0x686690ef4a57F11A4980e0053E2D1EdD69782F35";
    const contract = new ethers.Contract(marketplaceAddr, abi, payload.wallet);
    const order = await contract.orderProduct(
      payload.productId,
      payload.amount,
      payload.buyerId,
      {
        value: ethers.utils.parseEther(payload.amount),
      },
    );
    const tx = await order.wait();
    console.log(order);
    console.log(tx);
  }

  @OnEvent("Blast Not Ship Trigger")
  async handleBlastNotShipEvent(payload: any) {
    const marketplaceAddr = "0x686690ef4a57F11A4980e0053E2D1EdD69782F35";
    const contract = new ethers.Contract(marketplaceAddr, abi, payload.wallet);
    const order = await contract.orderProduct(
      payload.productId,
      payload.amount,
      payload.buyerId,
      {
        value: ethers.utils.parseEther(payload.amount),
      },
    );
    const tx = await order.wait();
    console.log(order);
    console.log(tx);
  }
}
