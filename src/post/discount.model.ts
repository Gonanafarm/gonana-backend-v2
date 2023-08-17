import {MongooseModule} from "@nestjs/mongoose";
import {discountSchema} from "./discount.schema";

export const DiscountModel = MongooseModule.forFeatureAsync([
  {
    name: "Discounts",
    useFactory: async () => {
      const schema = discountSchema;
      return schema;
    },
  },
]);
