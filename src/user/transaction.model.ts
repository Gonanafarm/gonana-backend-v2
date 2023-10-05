import {MongooseModule} from "@nestjs/mongoose";
import {tranSactionSchema} from "./transaction.schema";
export const TransactionModel = MongooseModule.forFeatureAsync([
  {
    name: "Transactions",
    useFactory: async () => {
      const schema = tranSactionSchema;

      return schema;
    },
  },
]);
