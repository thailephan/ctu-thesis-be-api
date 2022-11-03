require("dotenv").config();
// require("./repository/connect");

import express, { Express } from "express";
import * as http from "http";
import cors from "cors";
// import compression from "compression";

const debug = require("./common/debugger");
const { server: serverConfig } = require("./config");
// const firebase = require( "./common/firebase");
const firebase: any = {};
const app: Express = express();
// const mail = require("./service/mails");

app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
// app.use(compression());
//
require("./features/auth")(app);
require("./features/invitations")(app);
// require("./features/users")(app, firebase);
// require("./features/classes")(app);
// require("./features/departments")(app);
// require("./features/courses")(app);
// require("./features/message-types")(app);
// require("./features/friends")(app);
// require("./features/messages")(app);
// require("./features/chat-rooms")(app);

// mail.resetPassword("thailephanminh@gmail.com");

app.listen(serverConfig.PORT, function(){
 debug.api(`Listening at ${serverConfig.PORT}`)
});