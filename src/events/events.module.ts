import { Module } from "@nestjs/common";
import { EventModel } from "./events.model";
import { EventService } from "./events.service";

@Module({
  providers: [EventService],
  imports: [EventModel],
  exports: [EventModel, EventService]
})
export class EventModule { }
