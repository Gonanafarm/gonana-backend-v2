import { MongooseModule } from "@nestjs/mongoose";
import { Event, EventDocument, EventSchema } from "./events.schema";

export const EventModel = MongooseModule.forFeature([
  { name: Event.name, schema: EventSchema }
]);
