/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { TaxonomyDocument, Taxonomy } from "./taxonomy.schema";
import { paramCase } from "param-case";
import { GenericService } from "../generic/generic.service";
import { GenericOrgService } from "src/generic/generic.org.service";


@Injectable()
export class TaxonomyService extends GenericOrgService<TaxonomyDocument> {
  constructor(@InjectModel(Taxonomy.name) private model: Model<TaxonomyDocument>) {
    super(model);
  }
}
