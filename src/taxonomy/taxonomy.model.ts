import { MongooseModule } from "@nestjs/mongoose";
import { Taxonomy, TaxonomySchema } from "./taxonomy.schema";

export const TaxonomyModel = MongooseModule.forFeature([
  { name:  Taxonomy.name, schema: TaxonomySchema }
]);
