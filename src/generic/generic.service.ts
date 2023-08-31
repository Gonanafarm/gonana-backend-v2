/* eslint-disable no-useless-catch */
import {Controller, Injectable, Module} from "@nestjs/common";
import {Model, Document} from "mongoose";
import {
  DeletionException,
  ResourceNotFoundException,
} from "../common/exceptions";
import {ServiceInterface} from "./generic.interface";

export class GenericService<T extends Document> implements ServiceInterface {
  constructor(public dataModel: Model<T>) {}

  create = async (publisher_id: string, publishItemDto: any) => {
    return new this.dataModel({...publishItemDto, publisher_id}).save();
  };

  updateItem = async (item_id: string, updateDoc: any) => {
    try {
      const updated = await this.dataModel.findByIdAndUpdate(
        item_id,
        {...updateDoc},
        {new: true},
      );
      if (updated == null || updated == undefined) {
        throw ResourceNotFoundException();
      }
      return updated;
    } catch (e) {
      throw e;
    }
  };

  deleteItem = async (item_id: string): Promise<any> => {
    const deletedItem = await this.dataModel.deleteOne({_id: item_id});
    if (deletedItem.deletedCount !== 1) {
      throw DeletionException();
    }
    return {success: true, message: `deleted item with id ${item_id}`};
  };

  getItem = async (item_id: string) => {
    try {
      const item = await this.dataModel.findById(item_id);
      if (item == null || item == undefined) {
        throw ResourceNotFoundException();
      }
      return item;
    } catch (err) {
      throw err;
    }
  };

  retrieveItems = async (filter: {[key: string]: any}) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    //@ts-ignore
    return await this.dataModel.find(filter).exec();
  };
}
