/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ResourceNotFoundException } from "../common/exceptions";
import { PublishEventDto, UpdateEventDto } from "./events.dto";
import { EventModel } from "./events.model"
import { EventDocument, Event } from "./events.schema";
import { paramCase } from "param-case";
import { GenericService } from "../generic/generic.service";


@Injectable()
export class EventService extends GenericService<EventDocument> {
  constructor(@InjectModel(Event.name) private taxonomyModel: Model<EventDocument>) {
    super(taxonomyModel);
  }
}
