/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ResourceNotFoundException } from "../common/exceptions";
import { PublishTaxonomyDto, UpdateTaxonomyDto } from "./taxonomy.dto";
import { TaxonomyModel } from "./taxonomy.model"
import { TaxonomyDocument, Taxonomy } from "./taxonomy.schema";
import { paramCase } from "param-case";
import { GenericService } from "../generic/generic.service";


@Injectable()
export class TaxonomyService extends GenericService {
  constructor(@InjectModel(Taxonomy.name) private taxonomyModel: Model<TaxonomyDocument>) {
    super(taxonomyModel);
  }
}
