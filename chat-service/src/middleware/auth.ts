import jwt from 'jsonwebtoken';
import {Server} from "socket.io";
import axios from "axios";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import { OverrideSocket } from "../common/interface";
const config = require("../config");
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io:  Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    io.use((socket: OverrideSocket, next) => {
        const token = socket.handshake.auth.accessToken || socket.handshake.headers["access-token"];
        if (Helpers.isNullOrEmpty(token)) {
            return next(new Error("Token bị rỗng"));
        }
        jwt.verify(token, config.token.accessTokenSecret, async (err: any, decoded: any) => {
            if (err) {
                debug.middleware("jwt.verify", JSON.stringify(err), "ERROR");
                return next(new Error("access token không đúng"));
            } else {
                const instance = axios.create({
                    baseURL: config.service.API_SERVICE_URL,
                    timeout: 1000,
                    headers: {
                        authorization: `Bearer ${token}`
                    }
                });

                socket.currentUser = decoded;
                socket.accessToken = token;
                try {
                    const result = await instance.get("/channels/getAll");
                    if (result.data.success) {
                        const channelIds = result.data.data.map(r => `${r.id}`);
                        debug.middleware("Load channelIds", JSON.stringify(channelIds));
                        const allChannelIds = [...channelIds, "users/" + decoded.id];
                        socket.join(allChannelIds);

                        // TODO: Add Consumer to api service
                        // await consumer.subscribe({topics: allRoomIds, fromBeginning: true});
                    } else {
                        socket.emit("error", "Unable to load instance");
                    }
                } catch (e) {
                    debug.middleware("Load channelIds", JSON.stringify(e));
                    socket.emit("error", e.message);
                }
                next();
            }
        });
    });
}
