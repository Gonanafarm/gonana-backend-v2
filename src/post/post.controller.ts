import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {ApiResponse, ApiTags, ApiHeader} from "@nestjs/swagger";
import {IsString, IsNotEmpty} from "class-validator";
import {PublishPostDto, UpdatePostDto} from "./post.dto";
import {PostService} from "./post.service";
import {Post as PostModel} from "./post.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {Request} from "express";
import {FileInterceptor} from "@nestjs/platform-express";
import * as cloudinary from "cloudinary";
import {CloudinaryService} from "./cloudinary.service";

@ApiTags("posts-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/posts")
export class PostController {
  constructor(
    private readonly dataService: PostService,
    private cloudinary: CloudinaryService,
  ) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of posts",
    isArray: true,
    type: PostModel,
  })
  get(@Req() req: Request) {
    let publisher_id = "";

    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.retrieveItems({publisher_id: publisher_id});
  }

  @Post("")
  @ApiResponse({
    status: 200,
    description: "Created post successfully",
    isArray: false,
    type: PostModel,
  })
  async publish(@Body() body: PublishPostDto, @Req() req: Request) {
    let publisher_id = "";
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return await this.dataService.create(publisher_id, body);
  }

  @Delete(":item")
  async deleteItem(@Param("item") item: string): Promise<any> {
    return this.dataService.deleteItem(item);
  }

  @Get(":item")
  @ApiResponse({
    status: 200,
    description: "Returns item by id",
    isArray: false,
    type: PostModel,
  })
  async getById(@Param("item") item: string) {
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

  @Post("upload-image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    let res = await this.cloudinary.uploadImage(file);
    return res.url;
  }
}
