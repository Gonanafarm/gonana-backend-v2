import { Body, Controller, Delete, Get, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { Schema } from "@nestjs/mongoose";
import { ApiTags, ApiResponse, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PublishTaxonomyDto, UpdateTaxonomyDto } from "./taxonomy.dto";
import { Taxonomy } from "./taxonomy.schema";
import { TaxonomyService } from "./taxonomy.service";
import { Request } from "express";

@ApiTags("taxonomy")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("catalog/taxonomy")
export class TaxonomyController {

  constructor(private readonly taxonomyService: TaxonomyService) { }

  @Get("")
  @ApiResponse({ status: 200, description: 'Returns list of store taxonomies', isArray: true, type: Taxonomy })
  get(@Req() req: Request) {
    return this.taxonomyService.retrieveItems({ publisher_id: req.user.sub })
  }

  @Post("")
  @ApiResponse({ status: 200, description: 'Create record successfully', isArray: false, type: Taxonomy })
  async publish(@Body() body: PublishTaxonomyDto, @Req() req: Request) {
    return await this.taxonomyService.create(req.user.sub, body)
  }

  @Delete(":item")
  detete(@Param("item") item: string) {
    return this.taxonomyService.deleteItem(item)
  }

  @Get(":item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Taxonomy })
  async getById(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }

  @Put(":item")
  @ApiResponse({ status: 200, description: 'Updates item record', isArray: false, type: Taxonomy })
  async update(@Param("item") item: string, @Body() body: UpdateTaxonomyDto) {
    return await this.taxonomyService.updateItem(item, body);
  }

}
