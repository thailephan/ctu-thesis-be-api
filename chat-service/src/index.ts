import path from "path";
require("dotenv").config({
    path: process.env.NODE_ENV === "development_local" ? path.resolve(process.cwd(), '.env.development.local') : path.resolve(process.cwd(), '.env'),
});
import { createServer } from "http";
import { Server } from "socket.io";
import axios from "axios";
import { createClient } from "redis";

/* COMMON */
import { OverrideSocket } from "./common/interface";
const debug = require("./common/debugger");
const config = require("./config");

const httpServer = createServer();
const redisClient = createClient();
const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

async function init() {
    redisClient.on("error", (err) => console.log("Redis client error", err));
    await redisClient.connect();
}
init()
    .then(() => {
        require("./middleware/auth")(io, redisClient);

        io.on("connection", async (socket: OverrideSocket) => {
            debug.socket('Connected socket id', socket.id);
            const api = {
                api: axios.create({
                    baseURL: config.service.API_SERVICE_URL,
                    timeout: 1000,
                    headers: {
                        authorization: `Bearer ${socket.accessToken}`
                    }
                }),
                asset: axios.create({
                    baseURL: config.service.ASSET_SERVICE_URL,
                    timeout: 1000,
                    headers: {
                        authorization: `Bearer ${socket.accessToken}`
                    }
                }),
            };
            // TODO: Multiple device login
            // TODO: st device
            /*
            *   User id 1 login
            *   Update online status of user 1 login
            *   send user online to every channel that user has
            * */
            /*
            *   Init
            *   Load status of user (all - load just 10)
            * */
            // TODO: nd device
            /*
            *   User id 1 login
            *   Update online status of user 1 login in redis to 2
            * */
            // const userOnlineDeviceIds = await redis.sAdd(`user/device/${userId}`, );
            // if (userOnlineDeviceIds.length === 0) {
            //
            // }

            /* COMMON */
            require("./features/common")(io, socket, api, redisClient);
            /* USER */
            require("./features/user")(io, socket, api, redisClient);
            /* CHAT */
            require("./features/message")(io, socket, api, redisClient);
            /* TYPING */
            require("./features/typing")(io, socket, api, redisClient);
            /* FRIEND */
            require("./features/invitation")(io, socket, api, redisClient);
            /* FRIEND */
            require("./features/friend")(io, socket, api, redisClient);
            /* CHANNEL */
            require("./features/channel")(io, socket, api, redisClient);
        });
    })
    .then(() => {
    httpServer.listen(config.server.PORT, () => {
        debug.api("LISTEN", `Listening at ${config.server.PORT}`);
    });
    httpServer.on("close", async () => {
       await redisClient.disconnect();
    });
});