require("dotenv").config();
// require("./repository/connect");

import { Server } from "socket.io";
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
const io = new Server(server);

app.use(cors());
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(compression());

// Websocket
require("./features/websocket")(io);

// API
require("./features/api/auth")(app);
require("./features/api/users")(app, firebase);
require("./features/api/classes")(app);
require("./features/api/departments")(app);
require("./features/api/courses")(app);
require("./features/api/message-types")(app);

server.listen(serverConfig.PORT, function(){
 debug.api(`Listening at ${serverConfig.PORT}`)
});