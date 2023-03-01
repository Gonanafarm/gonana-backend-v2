export default {
  isDev,
  isProd,
  isTest,
  host: process.env.API_HOST,
  paystack_secret: process.env.PAYSTACK_SECRET,

  monify_secret: "XWGTCPLSR3U7G3AAAV1TC0TP2PZ04ZEP",
  monify_key: "MK_TEST_MJGUL3L7CR",
  appruv_token:
    "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5hcHBydXZlLmNvIiwianRpIjoiZGVhNTcxZDktOTM1ZS00Nzk4LTlmM2YtY2EzM2ZkNTY5OWUyIiwiYXVkIjoiYmQ1ZWRlMjItODE5NS00NjNkLWI1MGItZWRmODk4ZWE5OGE1Iiwic3ViIjoiYjBlMjQ2YzUtMjMxYy00MWMzLWIxNWQtM2E2ZWQyNDdlNTEyIiwibmJmIjowLCJzY29wZXMiOlsidmVyaWZpY2F0aW9uX3ZpZXciLCJ2ZXJpZmljYXRpb25fbGlzdCIsInZlcmlmaWNhdGlvbl9kb2N1bWVudCIsInZlcmlmaWNhdGlvbl9pZGVudGl0eSJdLCJleHAiOjMyNTQ1Nzk0NDksImlhdCI6MTY3NjY1NjI0OX0.hPrG5Y_lCC3oZAcBUSa6-UHrm89YCouLpKNRBwlqSyE",
  port: process.env.PORT,
  db: process.env.MONGO_URL,
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
    preflightContinue: false,
    optionsSuccessStatus: 200,
  },
  auth: {
    jwtTokenExpireInSec: "1d", // 1 day
    passwordResetExpireInMs: 60 * 60 * 1000, // 1 hour
    activationExpireInMs: 24 * 60 * 60 * 1000, // 1 day
    saltRounds: 10,
    secret: process.env.AUTH_SECRET ?? "secret",
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
