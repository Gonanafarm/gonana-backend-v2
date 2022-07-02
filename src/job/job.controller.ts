import { Body, Controller, Delete, Get, Inject, Module, Param, Post, Put, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsString, IsNotEmpty } from "class-validator";
import { PublishJobDto } from "./job.dto";
import { JobService } from "./job.service";



@ApiTags("jobs")
@Controller("jobs")
export class JobController {

  constructor(private readonly jobService: JobService) { }

  @Get("")
  get() {
    return this.jobService.retrieveJobs({})
  }

  @Get("/published")
  userPublishedJobs(@Query() query: any) {
    return this.jobService.retrieveJobs({ initiator_id: "507f191e810c19729de860ea" })
  }


  @Get("/assigned")
  userAssignedJobs() {
    return this.jobService.retrieveJobs({ agent_id: "" })
  }

  @Get("/receiving")
  userReceivingJobs() {
    return this.jobService.retrieveJobs({ receipient_id: "" })
  }


  @Post("publish")
  async publishJob(@Body() body: PublishJobDto) {
    console.log(body.agent_id);
    return await this.jobService.publishJob(body)
  }

  @Delete(":job")
  deteteJob(@Param("job") job: string) {
    return this.jobService.deleteJob(job)
  }

  @Get(":job")
  async getJob(@Param("job") job: string) {
    return await this.jobService.getJob(job);
  }

  @Put(":job/assign-agent")
  assignJobAgent(@Param("job") job: string) {
    return ""
  }

  @Put(":job/status")
  updateJobStatus(@Param("job") job: string) {
    return ""
  }

}
