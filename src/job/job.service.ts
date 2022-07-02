import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ResourceNotFoundException } from "../common/exceptions";
import { JobQueryDto, PublishJobDto, UpdateJobAgent } from "./job.dto";
import { JobModel } from "./job.model"
import { Job, JobDocument } from "./job.schema";

@Injectable()
export class JobService {


  constructor(@InjectModel(Job.name) private jobModel: Model<JobDocument>) { }


  publishJob = async (publishJobDto: PublishJobDto) => {
    return new this.jobModel(publishJobDto).save();
  };

  updateJobAgent = (updateJobAgent: UpdateJobAgent) => {

  };

  updateJob = () => {

  };


  deleteJob = async (job_id: string) => {
    return await this.jobModel.deleteOne({ _id: job_id });
  };

  getJob = async (job_id: string) => {
    try {
      let job = await this.jobModel.findById(job_id);

      if (job == null || job == undefined) {
        throw ResourceNotFoundException();
      }

      return job
    } catch (err) {
      throw err;
    }

  };


  retrieveJobs = async (query: JobQueryDto) => {
    return await this.jobModel.find(query).exec();
  };
}
