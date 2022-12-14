import jwt from 'jsonwebtoken';
import {Server} from "socket.io";
import axios from "axios";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {IRedis, OverrideSocket} from "../common/interface";
const config = require("../config");
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io:  Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, redis: IRedis) => {
    io.use(async (socket: OverrideSocket, next) => {
        const token = socket.handshake.auth.accessToken || socket.handshake.headers["access-token"];
        if (Helpers.isNullOrEmpty(token)) {
            return next(new Error("Token bị rỗng"));
        }

        const jsonAccount = await redis.get(`auth/tokens/${token}`);
        console.log("isTokenValid", jsonAccount);
        if (!jsonAccount) {
            socket.emit("error", ({
                message: "Token không lệ",
                code: "001",
                success: false,
            }));
            debug.middleware("Get jsonAccount", JSON.stringify("Token is invalid"), "ERROR");
            socket.disconnect(true);
            return;
        }

        const instance = axios.create({
            baseURL: config.service.API_SERVICE_URL,
            timeout: 1000,
            headers: {
                authorization: `Bearer ${token}`
            }
        });

        const account = JSON.parse(jsonAccount);
        socket.currentUser = account;
        socket.accessToken = token;

        try {
            const result = await instance.get("/channels/getAllWithEmptyMessageChannel");
            if (result.data.success) {
                const channelIds = result.data.data.map(r => `${r.id}`);
                debug.middleware("Load channelIds", JSON.stringify(channelIds));
                const allChannelIds = [...channelIds, "users/" + account.id];
                socket.join(allChannelIds);
                // TODO: Add Consumer to api service
                // await consumer.subscribe({topics: allRoomIds, fromBeginning: true});
                next();
            } else {
                debug.middleware("Get channels/getAll", JSON.stringify("unable to load instance"), "ERROR");
                socket.emit("error", "Unable to load instance");
                socket.disconnect(true);
            }
        } catch (e) {
            debug.middleware("Load channelIds", JSON.stringify(e), "ERROR");
            socket.disconnect(true);
        }
    });
}
