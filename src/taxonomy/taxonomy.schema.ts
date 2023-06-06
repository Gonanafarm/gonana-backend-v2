import { Prop, Schema, raw, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type TaxonomyDocument = Taxonomy & Document;

@Schema({
  timestamps: {
    createdAt: 'created_at', // Use `created_at` to store the created date
    updatedAt: 'updated_at', // and `updated_at` to store the last updated date
  },
})
export class Taxonomy {
  @Prop({ type: mongoose.SchemaTypes.ObjectId, required: false })
  publisher_id: string;
  @Prop({ type: mongoose.SchemaTypes.ObjectId, required: true })
  branch_id: string;
  @Prop({ type: mongoose.SchemaTypes.ObjectId, required: true })
  org_id: string;
  @Prop({
    type: mongoose.SchemaTypes.String,
    default: 'manual',
  })
  @ApiProperty()
  type: string;

  @Prop({
    type: mongoose.SchemaTypes.String,
    default: 'global',
  })
  @ApiProperty()
  Taxonomy_context: string;

  // biodata
  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  @ApiProperty()
  name: string;
  @Prop({ type: mongoose.SchemaTypes.String })
  @ApiProperty()
  handle: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  description: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  parent_id: string;

  @ApiProperty()
  @Prop({ type: mongoose.SchemaTypes.String })
  image: string;
}

export const TaxonomySchema = SchemaFactory.createForClass(Taxonomy);

TaxonomySchema.virtual("id").get(function () {
  //@ts-ignore
  return this._id.toHexString();
});

// Ensure virtual fields are serialised.
TaxonomySchema.set("toJSON", {
  virtuals: true,
});
