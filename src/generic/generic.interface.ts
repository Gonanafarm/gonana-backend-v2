
import { Request, Response, NextFunction } from 'express';
import { User } from 'src/user/user.schema';

// Declaring custom request interface
// We export this interface so that we can use it in other places in our project



export interface ServiceInterface {
  create: (publish_id: string, publishItemDto: any) => Promise<any>;
  updateItem: (item_id: string, updateDoc: any) => Promise<any>;
  deleteItem: (item_id: string) => Promise<any>;
  getItem: (item_id: string) => Promise<any>;
  retrieveItems: (filter: { [key: string]: any }) => Promise<any>;
}



export interface AppRequest extends Request {
  user?: any;
}