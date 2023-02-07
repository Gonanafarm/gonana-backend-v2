/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from '@nestjs/common';
import { Model, Document } from 'mongoose';
import { GenericService } from './generic.service';

export class GenericOrgService<T extends Document> extends GenericService<T> {
  constructor(public dataModel: Model<T>) {
    super(dataModel);
  }

  createOrgResource = async (
    publishItemDto: any,
    publisher_id: string,
  ) => {
    return new this.dataModel({
      ...publishItemDto,
      publisher_id,
    }).save();
  };



}
