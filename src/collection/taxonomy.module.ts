import { Module } from "@nestjs/common";
import { TaxonomyController } from "./taxonomy.controller";
import { TaxonomyModel } from "./taxonomy.model";
import { TaxonomyService } from "./taxonomy.service";

@Module({
  providers: [TaxonomyService],
  imports: [TaxonomyModel],
  exports: [TaxonomyModel, TaxonomyService]
})
export class TaxonomyModule { }
