import express, { Express } from "express";
import cors from "cors";
import path from "path";

require("dotenv").config({
 path: process.env.NODE_ENV === "development_local" ? path.resolve(process.cwd(), '.env.local.development') : path.resolve(process.cwd(), '.env'),
});

const debug = require("./common/debugger");
const { server: serverConfig } = require("./config");
const firebase: any = {};
const app: Express = express();

app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());

require("./features/auth")(app);
require("./features/friends")(app);
require("./features/invitations")(app);
require("./features/users")(app, firebase);
require("./features/channels")(app);
require("./features/message-types")(app);
require("./features/channel-types")(app);
require("./features/messages")(app);

app.listen(serverConfig.PORT, function(){
 debug.api("LISTEN", `Listening at ${serverConfig.PORT}`);
});