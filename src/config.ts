import { env } from "process";

export default {
  isDev,
  isProd,
  isTest,
  host:process.env.API_HOST??"http://localhost:5000",
  paystack_secret: process.env.PAYSTACK_SECRET ?? "sk_test_38b346b48237c58df454d070f9dda48f61d83114",
  port: process.env.PORT ?? 5000,
  db: process.env.MONGO_URL ?? "mongodb://127.0.0.1:27017/churchstack",
  mail: {
    from: {
      name: "Your Name",
      address: "10xjoshua@gmail.com",
    },
  },
  cors: {
    // https://github.com/expressjs/cors#configuration-options
    origin: "*",
    methods: "POST,GET,PUT,OPTIONS,DELETE",
    allowedHeaders:
      "Timezone-Offset,Origin,X-Requested-With,Content-Type,Accept,Authorization,authorization,*",
    "preflightContinue": false,
    "optionsSuccessStatus": 200,
  },
  auth: {
    jwtTokenExpireInSec: "1d", // 1 day
    passwordResetExpireInMs: 60 * 60 * 1000, // 1 hour
    activationExpireInMs: 24 * 60 * 60 * 1000, // 1 day
    saltRounds: 10,
    secret: process.env.AUTH_SECRET ?? "joshua"
  },
  static: {
    maxAge: isProd() ? "1d" : 0,
  },
};

function isDev() {
  return process.env.NODE_ENV === "development";
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

function isTest() {
  return process.env.NODE_ENV === "test";
}
