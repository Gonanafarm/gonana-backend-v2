import { Prop } from "@nestjs/mongoose";
import { Document, SchemaTypes } from "mongoose";


type JobTypes = "pickup-delivery" | "delivery"
type JonIntervals = "one-time" | "subsription"

export type Job = Readonly<{
  id: string;
  created_at: Date;
  updated_at: Date;

  type: JobTypes;

  order_id: string;

  status: string;

  initiator_id:  any;
  initiator: Object;

  receipient_id: any;
  receipient: Object;
  agent_id:  any;
  agent: Object;

  initiator_status: string;
  receipient_status: string;
  agent_status: string;

  requires_pickup: boolean;

  deliver_to_location: Object;
  deliver_to: Object;
  delivery_time: Object;

  pickup_from_location: Object;
  pickup_time: Object;
}> &
  Document;
