import {MongooseModule} from "@nestjs/mongoose";
import {TokenSchema} from "./token.schema";

export const TokenModel = MongooseModule.forFeature([
  {name: "Token", schema: TokenSchema},
]);
