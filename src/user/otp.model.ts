import {MongooseModule} from "@nestjs/mongoose";
import {otpSchema} from "./otp.schema";
import {addTtlIndex} from "./otp.schema";
export const OtpModel = MongooseModule.forFeatureAsync([
  {
    name: "Otp",
    useFactory: async () => {
      const schema = otpSchema;

      schema.plugin(addTtlIndex);
      return schema;
    },
  },
]);
