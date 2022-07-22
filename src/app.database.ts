import { MongooseModule } from "@nestjs/mongoose";

export const DatabaseModule = MongooseModule.forRoot("mongodb://127.0.0.1:27017/centralmarket-tests")