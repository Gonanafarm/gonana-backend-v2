import { Module } from "@nestjs/common";
import { JobController } from "./job.controller";
import { JobModel } from "./job.model";
import { JobService } from "./job.service";

@Module({
  providers: [JobService],
  imports: [JobModel],
  exports: [JobModel, JobService],
  controllers: [JobController]
})
export class JobModule { }
