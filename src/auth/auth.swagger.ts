import { DocumentBuilder } from "@nestjs/swagger";

import { setupSwaggerDocument } from "../common/swagger";

export default setupSwaggerDocument(
  "auth",
  new DocumentBuilder().addServer("http://localhost:5000")
    .setTitle("Authorization Docs")
    .setDescription("Basic user authorization features")
    .setVersion("1.0")
    .setBasePath("api")
    .addTag("auth")
    .build(),
);
