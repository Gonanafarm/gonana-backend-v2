import { Body, Controller, Delete, Get, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { Schema } from "@nestjs/mongoose";
import { ApiTags, ApiResponse, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PublishEventDto, UpdateEventDto } from "./events.dto";
import { Event } from "./events.schema";
import { EventService } from "./events.service";
import { Request } from "express";

@ApiTags("events")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("catalog/events")
export class EventController {

  constructor(private readonly taxonomyService: EventService) { }

  @Get("")
  @ApiResponse({ status: 200, description: 'Returns list of store taxonomies', isArray: true, type: Event })
  get(@Req() req: Request) {
    let publisher_id="";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id= req.user?.sub??"";

    return this.taxonomyService.retrieveItems({ publisher_id:  publisher_id })
  }

  @Post("")
  @ApiResponse({ status: 200, description: 'Create record successfully', isArray: false, type: Event })
  async publish(@Body() body: PublishEventDto, @Req() req: Request) {
    let publisher_id="";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id= req.user?.sub??"";
    return await this.taxonomyService.create(publisher_id, body)
  }

  @Delete(":item")
  async deleteItem(@Param("item") item: string) {
    return await this.taxonomyService.deleteItem(item)
  }

  @Get(":item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false, type: Event })
  async getById(@Param("item") item: string) {
    return await this.taxonomyService.getItem(item);
  }

  @Put(":item")
  @ApiResponse({ status: 200, description: 'Updates item record', isArray: false, type: Event })
  async update(@Param("item") item: string, @Body() body: UpdateEventDto, @Param("store") storeID: string) {
    return await this.taxonomyService.updateItem(item, body);
  }

}
