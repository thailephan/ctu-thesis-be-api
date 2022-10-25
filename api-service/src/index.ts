require("dotenv").config();
// require("./repository/connect");

import express, { Express } from "express";
import * as http from "http";
import cors from "cors";
import compression from "compression";

const debug = require("./common/debugger");
const { server: serverConfig } = require("./config");
// const firebase = require( "./common/firebase");
const firebase: any = {};
const app: Express = express();
const server  = http.createServer(app);
// const mail = require("./service/mails");

app.use(cors());
// app.use(express.urlencoded({extended: false}));
app.use(express.json());
// app.use(compression());
//
require("./features/auth")(app);
require("./features/users")(app, firebase);
// require("./features/classes")(app);
// require("./features/departments")(app);
// require("./features/courses")(app);
// require("./features/message-types")(app);
// require("./features/friend-requests")(app);
// require("./features/friendships")(app);
require("./features/messages")(app);
require("./features/room-members")(app);

// mail.resetPassword("thailephanminh@gmail.com");

server.listen(serverConfig.PORT, function(){
 debug.api(`Listening at ${serverConfig.PORT}`)
});