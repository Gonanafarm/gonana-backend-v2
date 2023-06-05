import { DocumentBuilder } from "@nestjs/swagger";
import config from "../config";

import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "account",
  new DocumentBuilder().addBearerAuth().addServer("")
    .setTitle("Account Docs")
    .setDescription("Basic account features")
    .setVersion("1.0")
    .setBasePath("")
    .addTag("account")
    .build(),
);
