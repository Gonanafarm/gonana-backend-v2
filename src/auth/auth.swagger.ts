import { DocumentBuilder } from "@nestjs/swagger";
import config from "../config";

import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "auth",
  new DocumentBuilder().addBearerAuth().addServer(config.host)
    .setTitle("Authorization Docs")
    .setDescription("Basic user authorization features")
    .setVersion("1.0")
    .setBasePath("api")
    .addTag("auth")
    .build(),
);
