import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
} from "@nestjs/common";
import {InjectModel} from "@nestjs/mongoose";
import axios from "axios";
import {UserService} from "./user.service";
import {User, UserDocument} from "./user.schema";
import {Model} from "mongoose";
import {PostModel} from "../post/post.model";
import {Post, PostDocument} from "../post/post.schema";
import {GeocodeService} from "../geocoder/service";
import {ShipmentData} from "./user.dto";

const key = process.env.SHIPBUBBLE_API_KEY;
const base_url = process.env.SHIPBUBBLE_BASE_URL;
const Headers = {
  Authorization: `Bearer ${key}`,
  "Content-Type": "application/json",
};

export function showObjectProperties(obj: Record<string, any>): void {
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      console.log(`Key: ${key}, Value: ${obj[key]}`);
    }
  }
}

@Injectable()
export class LogisticsService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Post.name) private readonly productModel: Model<PostDocument>,
    private geocodeService: GeocodeService,
  ) {}
  async validateUserAddress(
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
      console.error(error);
      throw new InternalServerErrorException(`${error.message}`);
    }
  }
  async getAvailableCouriers() {
    const url = `${base_url}/shipping/couriers`;
    try {
      const res = await axios.get(url, {headers: Headers});

      if (res.data.status !== "success") {
        throw new InternalServerErrorException("Get Couriers Request Failed");
      }

      const couriers = res.data.data;

      // Filter the data array to get names and pin_images of couriers with id 24032950 and status "operational"
      const filteredCouriers = couriers
        .filter(
          (courier: any) =>
            courier.package_categories.some(
              (category: any) => category.id === 24032950 || 2178251,
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
      throw new HttpException(
        {
          success: false,
          message: error.message,
        },
        error.status,
      );
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
      if(product.self_shipping === true){
        const addressString ={
          address: address,
          code: 0
        }
         product.address.push(addressString);
         await product.save();
         return{
          success: true,
          message: "Address validated successfully"
         }

      }
      const publisher_id = product.publisher_id;

      const user = await this.userModel.findById(publisher_id);
      if (!user) {
        throw new NotFoundException(`Owner of product may have deleted their account`);
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
      console.log(res);
      
      if (res.data.status !== "success") {
        throw new BadRequestException(res.data.message);
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
      console.log(error);
      
      throw new HttpException(
        {status: error.response.status, message: error.response.data.message},
        error.response.status,
      );
    }
  }
  async validateAddress(
    address: string,
    name: string,
    email: string,
    phone: string,
  ) {
    try {
      const url = `${base_url}/shipping/address/validate`;
      const data = {name: name, email: email, phone: phone, address: address};
      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        throw new HttpException(
          {
            success: false,
            status: HttpStatus.BAD_REQUEST,
            message: res.data.message,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const formatted_address = res.data.data.formatted_address;
      const address_code = res.data.data.address_code;
      return {
        success: true,
        data: {address: formatted_address, code: address_code},
      };
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.response.data.message,
        },
        error.response.status,
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
      const getTomorrowDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1);
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      const pickup_date = getTomorrowDate();

      const package_dimensions = {
        length: 20,
        width: 20,
        height: 20,
      };
      const url = `${base_url}/shipping/fetch_rates/${service_code}`;
      
      const data = {
        sender_address_code: sender_address_code,
        reciever_address_code: receiver_address_code,
        category_id: 24032950,
        package_items: [package_items],
        package_dimension: package_dimensions,
        delivery_instructions: delivery_instructions,
        pickup_date: pickup_date,
      };

      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        throw new InternalServerErrorException(
          "get shipping rates request failed",
        );
      }

      const response = res.data.data;
      return {success: true, data: response};
    } catch (error: any) {
      console.error(error);
      throw new HttpException(
        {
          success: false,
          message: error.response.data.message,
        },
        error.response.status,
      );
    }
  }

  async createShipment(
    request_token: string,
    service_code: string,
    courier_id: string,
    insurance_code?: string,
  ) {    
    console.log(request_token);
    console.log(service_code);
    console.log(courier_id);
    
    try {
      const url = `${base_url}/shipping/labels`;
      const data: ShipmentData = {
        request_token: request_token,
        service_code: service_code,
        courier_id: courier_id,
      };
      if (insurance_code !== undefined) {
        data.insurance_code = insurance_code;
      }

      const res = await axios.post(url, data, {headers: Headers});
      if (res.data.status !== "success") {
        throw new InternalServerErrorException("ShipBubble Request Failed");
      }
      return {
        success: true,
        message: res.data.message,
        data: res.data.data,
      };
    } catch (error: any) {
      throw new HttpException(
        {
          success: false,
          message: error.response.data.message,
        },
        error.status,
      );
    }
  }
}
