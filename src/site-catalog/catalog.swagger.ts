import { DocumentBuilder } from "@nestjs/swagger";
import config from "../config";
import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "siteCatalog",
  new DocumentBuilder().addBearerAuth().addServer(config.host??"")
    .setTitle("Site Catalog Docs")
    .setDescription("Basic site catalog func")
    .setVersion("1.0")
    .addTag("public")
    .build(),
);
