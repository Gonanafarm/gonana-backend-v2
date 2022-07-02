import { Prop, Schema, raw, SchemaFactory } from "@nestjs/mongoose";
import * as mongoose from "mongoose";
import { IAddress, IPerson } from "../common/interface";

export type JobDocument = Job & Document;

@Schema({
  timestamps: {
    createdAt: "created_at", // Use `created_at` to store the created date
    updatedAt: "updated_at", // and `updated_at` to store the last updated date
  },
  id: true,
})
export class Job {
  @Prop({ type: mongoose.SchemaTypes.ObjectId })
  id: string;

  @Prop({
    type: mongoose.SchemaTypes.String,
    default: "pickup-delivery",
    required: true,
  })
  type: string;
  @Prop({ type: mongoose.SchemaTypes.ObjectId, required: true })
  initiator_id: string;
  @Prop({ required: true, unique: true })
  order_id: string;
  @Prop({ type: String })
  initiator_status: string;
  @Prop({ type: mongoose.SchemaTypes.ObjectId })
  agent_id: string;
  @Prop({ type: mongoose.SchemaTypes.ObjectId })
  receipient_id: string;
  @Prop(
    raw({
      fullname: { type: String },
      phone: { type: String },
    }),
  )
  agent: Record<string, string>;
  @Prop(
    raw({
      fullname: { type: String },
      phone: { type: String },
    }),
  )
  receipient: Record<string, string>;

  @Prop(
    raw(IPerson),
  )
  initiator: Record<string, string>;

  @Prop({ type: mongoose.SchemaTypes.String })
  status: string;
  @Prop({ type: mongoose.SchemaTypes.String })
  agent_status: string;
  @Prop({ type: mongoose.SchemaTypes.String })
  receipient_status: string;
  @Prop({ type: mongoose.SchemaTypes.Boolean, default: true })
  requires_pickup: boolean;

  @Prop(
    raw(IAddress),
  )
  deliver_to_address: Record<string, string>;

  @Prop(
    raw(IPerson),
  )
  deliver_to: Record<string, string>;
  @Prop({ type: mongoose.SchemaTypes.Date, required: true })
  delivery_time: Date;
  @Prop(
    raw(IAddress),
  )
  pickup_from_address: Record<string, string>;
  @Prop({ type: mongoose.SchemaTypes.Date })
  pickup_time: Date;
}

export const JobSchema = SchemaFactory.createForClass(Job);
