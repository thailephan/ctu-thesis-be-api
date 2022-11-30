import path from "path";
require("dotenv").config({
 path: process.env.NODE_ENV === "development_local" ? path.resolve(process.cwd(), '.env.development.local') : path.resolve(process.cwd(), '.env'),
});
import express, { Express } from "express";
import cors from "cors";

const debug = require("./common/debugger");
const { server: serverConfig } = require("./config");
const redisClient = require("./common/redis").redisClient;

const app: Express = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", async (req, res) => {
 const parseIp = (req) => {
  let ip = req.headers['x-forwarded-for']?.split(',').shift()
     || req.socket?.remoteAddress;
  if (ip.substring(0, 7) == "::ffff:") {
   ip = ip.substring(7)
  }
  return ip;
 }
 console.log(parseIp(req));
 console.log(req.headers["user-agent"]);
 res.json("Ok");
})
require("./features/auth")(app);
require("./features/friends")(app);
require("./features/invitations")(app);
require("./features/users")(app);
require("./features/channels")(app);
require("./features/message-types")(app);
require("./features/channel-types")(app);
require("./features/messages")(app);

require("./common/redis").redisInit().then(() => {
 app.listen(serverConfig.PORT, function(){
  debug.api("LISTEN", `Listening at ${serverConfig.PORT}`);
 });
});