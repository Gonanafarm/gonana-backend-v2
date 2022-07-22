import { DocumentBuilder } from "@nestjs/swagger";

import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "catalog",
  new DocumentBuilder().addBearerAuth().addServer("http://localhost:5000")
    .setTitle("Catalog Docs")
    .setDescription("Basic store catalog management features")
    .setVersion("1.0")
    .setBasePath("")
    .addTag("product")
    .addTag("taxonomy")
    .build(),
);
