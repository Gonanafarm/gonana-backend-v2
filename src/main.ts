import * as dotenv from "dotenv";
dotenv.config({path: __dirname + "/../.env", override: false});
import * as cloudinary from "cloudinary";

import * as admin from "firebase-admin";
import {bootstrap} from "./bootstrap";
import * as Ably from "ably";
import {ABLY_API_KEY} from "./common/enums";
dotenv.config();

cloudinary.v2.config({
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
  cloud_name: process.env.CLOUDINARY_NAME,
});

var serviceAccountFile = require("../firebase-service.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountFile),
});
export const db = admin.firestore();
export const ably = new Ably.Realtime(ABLY_API_KEY);

bootstrap();