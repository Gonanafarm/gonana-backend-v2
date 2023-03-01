import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/../.env', override: false });

import * as admin from "firebase-admin";
import { bootstrap } from "./bootstrap";

dotenv.config();

function init_firebase() {
    var serviceAccountFile = require("../firebase-service.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountFile),
    });
}

init_firebase();
bootstrap();


