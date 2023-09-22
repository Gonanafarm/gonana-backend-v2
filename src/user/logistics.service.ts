import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import axios from "axios";
import {UserService} from "./user.service";
import {User, UserDocument} from "./user.schema";
import {Model} from "mongoose";
import {PostModel} from "../post/post.model";
import {Post, PostDocument} from "../post/post.schema";
import {GeocodeService} from "../geocoder/service";

const key = process.env.SHIPBUBBLE_API_KEY;
const base_url = process.env.SHIPBUBBLE_BASE_URL;
const Headers = {
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

@Injectable()
export class LogisticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly postModel: Model<PostDocument>,
    private geocodeService: GeocodeService,
  ) {}
  async validateAddress(
    name: string,
    email: string,
    phone: string,
    address: string,
  ) {
    try {
      console.log(name, email, phone, address);

      const url = `${base_url}/shipping/address/validate`;
      const data = {name: name, email: email, phone: phone, address: address};
      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        return {success: false, message: "Request failed"};
      }
      const response = res.data.data;

      const user = await this.userModel.findOne({email: email});

      const addressExists = user?.address.find(
        (string: any) => string === response.formatted_address,
      );

      if (!addressExists) {
        user?.address.push(response.formatted_address);
        await user?.save();
      }

      return {success: true, data: response};
    } catch (error: any) {
      console.error(error);
      return {success: false, message: error.message};
    }
  }
  async getPickupAddress(id: string) {}
  async getAvailableCouriers() {
    const url = `${base_url}/shipping/couriers`;

    try {
      const res = await axios.get(url, {headers: Headers});

      if (res.data.status !== "success") {
        return {success: false, message: "Request failed"};
      }

      const couriers = res.data.data;

      // Filter the data array to get names and pin_images of couriers with id 24032950 and status "operational"
      const filteredCouriers = couriers
        .filter(
          (courier: any) =>
            courier.package_categories.some(
              (category: any) => category.id === 24032950,
            ) && courier.status === "operational",
        )
        .map((courier: any) => ({
          name: courier.name,
          pin_image: courier.pin_image,
          service_code: courier.service_code,
        }));

      return {success: true, couriers: filteredCouriers};
    } catch (error: any) {
      console.error(error);
      return {success: false, message: error.message};
    }
  }

  async getShippingRates(service_code: string,sender_address_code:number, receiver_address_code:number) {
    const availableCouriers = await this.getAvailableCouriers();
    if (availableCouriers.success !== true) {
      return {
        success: false,
        message: "Request failed",
        error: availableCouriers.message,
      };
    }

    const exists: boolean = availableCouriers.couriers.some((obj: any) =>
      Object.values(obj).includes(service_code),
    );
    if (!exists) {
      return {
        success: false,
        message: "Courier not Available or invalid service code",
      };
    }
    const url = `${base_url}/shipping/fetch_rates/${service_code}`;
    const data = {
      sender_address_code: sender_address_code,

    }
  }
}
