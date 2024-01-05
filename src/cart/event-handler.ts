import {Injectable} from "@nestjs/common";
import {OnEvent} from "@nestjs/event-emitter";
import axios from "axios";
import {CartItemService} from "./service";

@Injectable()
export class CartEventHandler {
  constructor(private cartService: CartItemService) {}

  @OnEvent("Products Not Shipped")
  async handleChainEvent(payload: any) {
    const res = await axios.post(
      "https://gonana-market.onrender.com/order",
      payload,
    );
    console.log(res.data);
  }
}
