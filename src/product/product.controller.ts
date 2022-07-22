import { Body, Controller, Delete, Get, Header, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags, ApiHeader } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import { Request } from "express";
import { PublishProductDto, UpdateProductDto } from "./product.dto";
import { Product } from "./product.schema";
import { ProductService } from "./product.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";


@ApiTags("product")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("catalog/products")
export class ProductController {

  constructor(private readonly productService: ProductService) { }
  @Get("")
  @ApiResponse({ status: 200, description: 'Returns list of store products', isArray: true, type: Product })
  get(@Req() req: Request) {
    return this.productService.retrieveItems({ publisher_id: req.user.sub })
  }

  @Post("")
  @ApiResponse({ status: 200, description: 'Created product successfully', isArray: false, type: Product })
  async publish(@Body() body: PublishProductDto,@Req() req: Request) {
    return await this.productService.create(req.user.sub, body)
  }

  @Delete(":item")
  delete(@Param("item") item: string) {
    return this.productService.deleteItem(item)
  }

  @Get(":item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Product })
  async getById(@Param("item") item: string) {
    return await this.productService.getItem(item);
  }

  @Put(":item")
  @ApiResponse({ status: 200, description: 'Updates item record', isArray: false, type: Product })
  async update(@Param("item") item: string, @Body() body: UpdateProductDto) {
    return await this.productService.updateItem(item, body);
  }
}
