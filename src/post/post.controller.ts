import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Patch,
  Req,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {ApiResponse, ApiTags, ApiHeader} from "@nestjs/swagger";
import {EventEmitter2} from "@nestjs/event-emitter";
import {
  GetUserDto,
  PostType,
  PublishPostDto,
  UpdateAmountDto,
  UpdatePostDto,
} from "./post.dto";
import {PostService} from "./post.service";
import {Post as PostModel} from "./post.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Request} from "express";
import {Types} from "mongoose";
import {CloudinaryService} from "./cloudinary.service";
import {FileInterceptor, FilesInterceptor} from "@nestjs/platform-express";
import {String} from "lodash";
import {LogisticsService} from "../user/logistics.service";

@ApiTags("posts-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/posts")
export class PostController {
  constructor(
    private readonly dataService: PostService,
    private cloudinary: CloudinaryService,
    private eventEmmiter: EventEmitter2,
    private logisticsService: LogisticsService,
  ) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of posts",
    isArray: true,
    type: PostModel,
  })
  get(@Req() req: Request, @Query("type") type: string) {
    return this.dataService.get(type);
  }
  @Get("any-user-products")
  async getAnyUserProduct(@Query() body: GetUserDto) {
    return await this.dataService.getUsersProducts(
      body.id,
      body.type || undefined,
    );
  }
  @Get("/user-products")
  async getUserProducts(@Req() req: Request, @Query("type") type?: string) {
    //@ts-ignore
    const id = req?.user?.id;
    return await this.dataService.getByPublisherId(id, type);
  }

  @Post("")
  @UseInterceptors(FilesInterceptor("files"))
  @ApiResponse({
    status: 200,
    description: "Created post successfully",
    isArray: false,
    type: PostModel,
  })
  async publish(
    @Body() body: PublishPostDto,
    @Req() req: Request,
    @UploadedFiles() files: Array<Express.Multer.File>,
  ) {
    let amount = parseInt(body.amount);
    let quantity = parseInt(body.quantity);
    let geo_lat = parseInt(body.geo_lat);
    let geo_long = parseInt(body.geo_long);
    let weight = parseInt(body.weight);

    amount = isNaN(amount) == true ? 0 : amount;
    quantity = isNaN(quantity) == true ? 0 : quantity;
    geo_lat = isNaN(geo_lat) == true ? 0 : geo_lat;
    geo_long = isNaN(geo_long) == true ? 0 : geo_long;
    weight = isNaN(weight) == true ? 0 : weight;
    let images = await Promise.all(
      files.map(async file => {
        let res = await this.cloudinary.uploadImage(file);
        return res.eager[0].url;
      }),
    );
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    //@ts-ignore
    const name = `${req.user?.first_name} ${req.user?.last_name}`;
 
    //@ts-ignore
    const phone = req.user?.phone;

    //@ts-ignore
    const email = req.user?.email;

    const unformatted_address = body.address;
    const validatedAdress = await this.logisticsService.validateAddress(
      unformatted_address,
      name,
      email,
      phone,
    );
    const address = [validatedAdress.data]

    let payload = {
      ...body,
      images,
      location: {
        type: "Point",
        coordinates: [body.geo_long ?? 0, body.geo_lat ?? 0],
      },
      geo_long,
      geo_lat,
      quantity,
      amount,
      weight,
      address
    };
    const createPost = await this.dataService.create(publisher_id, payload);
    return createPost;
  }

  @Delete(":item")
  async deleteItem(@Param("item") item: string): Promise<any> {
    return this.dataService.deleteItem(item);
  }

  @Get("discounted-products")
  async discountedProducts() {
    return this.dataService.discountedProducts();
  }

  @Get(":item")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: PostModel,
  })
  async getById(@Param("item") item: string) {
    console.log(item);
    return await this.dataService.getItem(item);
  }

  @Put(":item")
  @ApiResponse({
    status: 200,
    description: "Updates item record",
    isArray: false,
    type: PostModel,
  })
  async update(@Param("item") item: string, @Body() body: UpdatePostDto) {
    return await this.dataService.updateItem(item, body);
  }

  @Patch("update-amount")
  async updateAmount(@Body() body: UpdateAmountDto) {
    return await this.dataService.updatePrice(body.id, body.amount);
  }

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
  ) {
    let res = await this.cloudinary.uploadImage(file);
    return res.eager[0].url;
  }
}
