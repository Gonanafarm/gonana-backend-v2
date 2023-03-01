import {DocumentBuilder} from "@nestjs/swagger";
import config from "../config";

import {setupSwaggerDocument} from "../common/swagger";

export default setupSwaggerDocument(
  "user-catalog",
  new DocumentBuilder()
    .addBearerAuth()
    .addServer(config.host ?? "")
    .setTitle("User Catalog Docs")
    .setDescription("")
    .setVersion("1.0")
    .build(),
);
