import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Headers,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import {ApiResponse, ApiTags, ApiHeader} from "@nestjs/swagger";
import {IsString, IsNotEmpty} from "class-validator";
import {PublishMemberDto, UpdateMemberDto} from "./member.dto";
import {MemberService} from "./member.service";
import {Member} from "./member.schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";

@ApiTags("member-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/member")
export class MemberController {
  constructor(private readonly dataService: MemberService) {}
  @Get("")
  @ApiResponse({
    status: 200,
    description: "Returns list of Members",
    isArray: true,
    type: Member,
  })
  get(@Query("org_id") org_id: StringConstructor) {
    return this.dataService.retrieveItems({org_id});
  }

  @Post("")
  async createMember(
    @Body() body: PublishMemberDto,
    @Req() req: any,
  ): Promise<any> {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";

    return this.dataService.createMember(publisher_id, body);
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
    type: Member,
  })
  async getById(@Param("item") item: string) {
    return await this.dataService.getItem(item);
  }

  @Put(":item")
  @ApiResponse({
    status: 200,
    description: "Updates item record",
    isArray: false,
    type: Member,
  })
  async update(@Param("item") item: string, @Body() body: UpdateMemberDto) {
    return await this.dataService.updateItem(item, body);
  }
}
