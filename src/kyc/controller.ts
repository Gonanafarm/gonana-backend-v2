import {Body, Controller, Param, Post, Req, UseGuards} from "@nestjs/common";
import {ApiHeader, ApiResponse, ApiTags} from "@nestjs/swagger";
import {KYCApplicationService} from "./service";
import {KYCApplication as KYCApplicationModel} from "./schema";
import {ApiBearerAuth} from "@nestjs/swagger";
import {JwtAuthGuard} from "../auth/jwt-auth.guard";
import {EnrollKYCDto} from "./dto";

@ApiTags("KYCApplication-controller")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("api/catalog/kyc-application")
// @ApiHeader({ name: 'Bypass-Tunnel-Reminder', required: true })
export class KYCApplicationController {
  constructor(private readonly dataService: KYCApplicationService) {}
  @Post("/enroll")
  @ApiResponse({
    status: 200,
    description: "Returns list of KYCApplications associated with org",
    isArray: true,
    type: KYCApplicationModel,
  })
  kycEnroll(@Req() req: any, @Body() body: EnrollKYCDto) {
    let publisher_id = "";
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    publisher_id = req.user?.sub ?? "";
    return this.dataService.kycEnroll(publisher_id, body);
  }

  @Post("/approve-admin/:application")
  @ApiResponse({
    status: 200,
    description: "Update KYC",
    isArray: true,
    type: KYCApplicationModel,
  })
  kycApprove(@Req() req: any, @Param("application") application: string) {
    return this.dataService.updateItem(application, {status: "completed"});
  }

  @Post("/reject-admin/:application")
  @ApiResponse({
    status: 200,
    description: "Update KYC",
    isArray: true,
    type: KYCApplicationModel,
  })
  kycReject(@Req() req: any, @Param("application") application: string) {
    return this.dataService.updateItem(application, {status: "rejected"});
  }
}
