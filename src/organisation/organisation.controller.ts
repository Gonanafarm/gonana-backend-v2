import { Body, Controller, Delete, Get, Headers, Inject, Module, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags, ApiResponse, ApiBearerAuth, ApiHeader } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateOrganisationCustomDomain, UpdateOrganisationIntegrations, UpdateOrganisationPreferredDomain, UpdateOrganizationDto } from "./organisation.dto";
import { Organization } from "./organisation.schema";
import { OrganizationService } from "./organisation.service";
import { Request } from "express";

@ApiTags("org")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("api/catalog/org")
export class OrgController {

  constructor(private readonly orgService: OrganizationService) { }

  @Get("")
  @ApiResponse({ status: 200, description: 'Return organization meta', type: Organization })
  async get(@Req() req: Request) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    const list = await this.orgService.retrieveItems({ publisher_id: publisher_id });

    if (list.length == 0) {
      return {}
    } else {
      return list[0]
    }
  }


  @Put()
  @ApiResponse({ status: 200, description: 'Updates item record', isArray: false, type: Organization })
  async update(@Body() body: UpdateOrganizationDto, @Req() req: Request) {
    console.log(body)
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return await this.orgService.updateItem(publisher_id, body);
  }


  @Put("/preferred-domain")
  @ApiResponse({ status: 200, description: 'Updates preferred domain name', isArray: false, type: Organization })
  async updatePreferredDomain(@Body() body: UpdateOrganisationPreferredDomain, @Req() req: Request) {
    console.log(body)
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return await this.orgService.updateItem(publisher_id, body);
  }

  @Put("/custom-domain")
  @ApiResponse({ status: 200, description: 'Updates custom domain for org', isArray: false, type: Organization })
  async updateCustomDomain(@Body() body: UpdateOrganisationCustomDomain, @Req() req: Request) {
    console.log(body)
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return await this.orgService.updateItem(publisher_id, body);
  }

  @Put("/integrations")
  @ApiResponse({ status: 200, description: 'Updates organisation integrations', isArray: false, type: Organization })
  async updateIntegrations(@Body() body: UpdateOrganisationIntegrations, @Req() req: Request) {
    console.log(body)
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return await this.orgService.updateItem(publisher_id, body);
  }
}
