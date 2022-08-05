import { DocumentBuilder } from "@nestjs/swagger";
import config from "../config";

import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "account",
  new DocumentBuilder().addBearerAuth().addServer(config.host)
    .setTitle("Account Docs")
    .setDescription("Basic user authorization features")
    .setVersion("1.0")
    .setBasePath("")
    .addTag("account")
    .build(),
);
