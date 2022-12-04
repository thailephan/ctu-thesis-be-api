import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { OverrideSocket, IService, IRedis } from "../common/interface";
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socket: OverrideSocket, service: IService, redis: IRedis) => {
    const user = socket.currentUser;
    const userId = socket.currentUser.id.toString();
    const deviceId = socket.currentUser.deviceId.toString() || "1";

    redis.get(`users/online/${userId}`).then(async v => {
        const numberOfDeviceConnection = parseInt(v || "0") + 1;
        await redis.set(`users/online/${userId}`, numberOfDeviceConnection);
    });

    socket.on("ping", () => {
        console.log("client ping");
        socket.emit("pong");
    });
    /* Common event */
    socket.on('disconnect', async function (reason) {
        console.log('socket disconnect...', socket.id, reason);
        const numberOfDeviceConnection = parseInt(await redis.get(`users/online/${userId}`) || "0") - 1;
        if (numberOfDeviceConnection >= 0) {
            await redis.set(`users/online/${userId}`, numberOfDeviceConnection);
        }
    });
    // When disconnect
    socket.on('disconnecting', async function (reason) {
        console.log('socket disconnecting...', socket.id, reason)
        const channelId = await redis.getDel(`channel-typing/user/${userId}`);

        try {
            await redis.sPop(`channel-typing/${channelId}`, userId);
            const typingUser = await redis.sMembers(`channel-typing/${channelId}`) || [];
            debug.socket("DISCONNECTING.TYPING", `Emitter: ${userId}. Channel: ${channelId}. TypingList: ${typingUser}`);
            io.to(channelId).emit("chat/untyping", {
                typingUsersId: typingUser,
                senderId: userId,
                channelId: parseInt(channelId) || channelId,
            });
        } catch (e) {
            // await redis.
            debug.socket("DISCONNECTING.TYPING", `Emitter: ${userId}. Channel: ${channelId}. Error: ${e.message}`, "ERROR");
            io.to(`${channelId}`).emit("chat/untyping", {
                typingUsersId: [],
                senderId: userId,
                channelId: parseInt(channelId) || channelId,
            });
        }
        // TODO: Call API to update user status when they offline
        // TODO: Emit status update to other users when this user is offline
    });
    socket.on('error', function (err) {
        console.log('received error from socket:', socket.id)
        debug.socket("RUNTIME.ERROR", `Emitter: ${userId}. Error: ${JSON.stringify(err)}`, "ERROR");
    });
}