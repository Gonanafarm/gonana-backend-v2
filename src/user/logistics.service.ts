import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
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
    @InjectModel(Post.name) private readonly productModel: Model<PostDocument>,
    private geocodeService: GeocodeService,
  ) {}
  async validateAddress(
    name: string,
    email: string,
    phone: string,
    address: string,
  ) {
    try {
      const url = `${base_url}/shipping/address/validate`;
      const data = {name: name, email: email, phone: phone, address: address};
      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        return {success: false, message: "Request failed"};
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
      console.error(error);
      return {success: false, message: error.message};
    }
  }
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
  async validatePostAddress(
    address: string,
    product_id: string,
    user_id: string,
  ) {
    try {
      const product = await this.productModel.findById(product_id);
      if (!product) {
        throw new NotFoundException(`Product not found`);
      }
      const publisher_id = product.publisher_id;

      const user = await this.userModel.findById(publisher_id);
      if (!user) {
        throw new NotFoundException(`User not found`);
      }
      if (user_id !== publisher_id) {
        throw new ForbiddenException("You did not create this post");
      }
      const name = `${user.last_name} ${user.first_name}`;
      const email = user.email;
      const phone = user.phone;
      const url = `${base_url}/shipping/address/validate`;
      const data = {name: name, email: email, phone: phone, address: address};
      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: res.data.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const response = res.data.data;
      const addressExists = product.address.find(
        (address: any) => address.address === response.formatted_address,
      );
      const addressData = {
        address: response.formatted_address,
        code: response.address_code,
      };
      if (!addressExists) {
        product.address.push(addressData);
        await product.save();
      }

      return {success: true, data: response};
    } catch (error: any) {
      console.error(error);
      const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {status: statusCode, error: error.message},
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getShippingRates(
    service_code: string,
    sender_address_code: number,
    receiver_address_code: number,
    package_items: any,
    delivery_instructions?: string,
  ) {
    try {
      const availableCouriers = await this.getAvailableCouriers();
      if (availableCouriers.success !== true) {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: availableCouriers.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
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
      const package_dimensions = {
        length: 30,
        width: 30,
        height: 30,
      };
      const url = `${base_url}/shipping/fetch_rates/${service_code}`;
      const data = {
        sender_address_code: sender_address_code,
        receiver_address_code: receiver_address_code,
        category_id: 24032950,
        package_items: package_items,
        package_dimensions: package_dimensions,
        delivery_instructions: delivery_instructions,
      };
      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        throw new HttpException(
          {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            error: res.data.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const response = res.data.data;
      return {success: true, data: response};
    } catch (error: any) {
      console.error(error);
      const statusCode = error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR;
      throw new HttpException(
        {status: statusCode, error: error.message},
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
