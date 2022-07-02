import { MongooseModule } from "@nestjs/mongoose";
import { Job, JobSchema } from "./job.schema";

export const JobModel = MongooseModule.forFeature([
  { name: Job.name, schema: JobSchema }
]);
