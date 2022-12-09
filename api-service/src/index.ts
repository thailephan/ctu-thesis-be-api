const path = require("path");
require("dotenv").config({
 path: process.env.NODE_ENV === "development_local" ? path.resolve(process.cwd(), '.env.development.local') : path.resolve(process.cwd(), '.env'),
});
import { Express } from "express";
import cors from "cors";

const debug = require("./common/debugger");
const { server: serverConfig } = require("./config");
const Helpers = require("./common/helpers");
const { redis } = require("./common/redis");
const express = require("express");
const app: Express = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", async (req, res) => {
 res.send("API work");
})
app.use((req, res, next) => {
 const parseIp = (req) => {
  let ip = req.headers['x-forwarded-for']?.split(',').shift()
      || req.socket?.remoteAddress;
  if (ip.substring(0, 7) == "::ffff:") {
   ip = ip.substring(7)
  }
  return ip;
 }
 // @ts-ignore
 req.metadata = {
  flowId: Helpers.randomString(16),
  ua: req.headers["user-agent"],
  ip: parseIp(req),
 };
 next();
});
app.get("/validate-code/:code", async (req, res) => {
 const code = req.params.code;
 console.log(code);
 if (Helpers.isNullOrEmpty(code)) {
  return res.status(200).json({
   success: false,
   statusCode: 400,
   message: "Không có code",
   data: null,
  });
 }

 const isExisted = !!(await redis.get(code));
 if (isExisted) {
  return res.status(200).json({
   success: true,
   statusCode: 200,
   message: null,
   data: true,
  });
 } else {
  return res.status(200).json({
   success: false,
   message: null,
   data: false,
  });
 }
});
require("./features/auth")(app);
require("./features/friends")(app);
require("./features/invitations")(app);
require("./features/users")(app);
require("./features/channels")(app);
require("./features/message-types")(app);
require("./features/channel-types")(app);
require("./features/messages")(app);

require("./common/redis").redisInit().then(() => {
 require("./common/kafka").init().then(() => {
      app.listen(serverConfig.PORT, function(){
       debug.api("LISTEN", `Listening at ${serverConfig.PORT}`);
      });
 });
});