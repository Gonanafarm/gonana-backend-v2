import { DocumentBuilder } from "@nestjs/swagger";
import config from "../config";

import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "catalog",
  new DocumentBuilder().addBearerAuth().addServer(config.host??"")
    .setTitle("Catalog Docs")
    .setDescription("Basic store catalog management features")
    .setVersion("1.0")
    .addTag("product")
    .addTag("taxonomy")
    .addTag("events")
    .addTag("posts")
    .build(),
);
