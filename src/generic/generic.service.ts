/* eslint-disable no-useless-catch */
import { Controller, Injectable, Module } from "@nestjs/common";
import { Model } from "mongoose";
import { ResourceNotFoundException } from "../common/exceptions";
import { ServiceInterface } from "./generic.interface";

export class GenericService implements ServiceInterface {

    constructor(private dataModel: Model<any & Document>) { }

    create = async (publisher_id: string, publishItemDto: any) => {
        console.log(publishItemDto);
        console.log("on create")
        return new this.dataModel({ ...publishItemDto, publisher_id }).save();
    };

    updateItem = async (item_id: string, updateDoc: any) => {
        try {
            const updated = await this.dataModel.findByIdAndUpdate(item_id, { ...updateDoc }, { new: true });
            if (updated == null || updated == undefined) {
                throw ResourceNotFoundException();
            }
            return updated;
        } catch (e) {
            throw e;
        }
    };

    deleteItem = async (item_id: string): Promise<any> => {
        return await this.dataModel.deleteOne({ _id: item_id });
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

    retrieveItems = async (filter: { [key: string]: any }) => {
        return await this.dataModel.find(filter).exec();
    };

}
