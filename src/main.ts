import * as dotenv from "dotenv";
dotenv.config({ path: __dirname + '/../.env', override: false });
import * as cloudinary from "cloudinary"

import * as admin from "firebase-admin";
import { bootstrap } from "./bootstrap";

dotenv.config();

cloudinary.v2.config({
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET,
    cloud_name: process.env.CLOUDINARY_NAME,
})

function init_firebase() {
    var serviceAccountFile = require("../firebase-service.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccountFile),
    });
}

init_firebase();
bootstrap();


