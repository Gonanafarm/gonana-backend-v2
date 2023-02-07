import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags, ApiHeader } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import { ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Request } from "express";


@ApiTags("ReservedAccounts")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/ReservedAccounts")
export class ReservedAccountController {

  constructor() {
  }

  @Get("")
  @ApiResponse({ status: 200, description: 'Returns list of ReservedAccounts', isArray: true })
  get(@Req() req: Request) {
    let publisher_id="";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id= req.user?.sub??"";
   
  }


  @Get(":item")
  @ApiResponse({ status: 200, description: 'Returns item by id', isArray: false })
  async getById(@Param("item") item: string) {
  
  }

}
