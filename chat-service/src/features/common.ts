import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { OverrideSocket, IService, IRedis } from "../common/interface";
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socket: OverrideSocket, service: IService, redis: IRedis) => {
    const user = socket.currentUser;
    const email = socket.currentUser.email.toString();
    // const deviceId = socket.currentUser.deviceId?.toString() || "1";

    // redis.get(`users/online/${email}`).then(async v => {
    //     const numberOfDeviceConnection = parseInt(v || "0") + 1;
    //     await redis.set(`users/online/${email}`, numberOfDeviceConnection);
    // });
    redis.set(`users/online/${email}`, socket.accessToken).then(() => {
        console.log(`user: ${email} is online`);
    });

    socket.on("ping", () => {
        console.log("client ping");
        socket.emit("pong");
    });
    /* Common event */
    socket.on('disconnect', async function (reason) {
        console.log('socket disconnect...', socket.id, reason);
        // const numberOfDeviceConnection = parseInt(await redis.get(`users/online/${email}`) || "0") - 1;
        // if (numberOfDeviceConnection >= 0) {
        //     await redis.set(`users/online/${email}`, numberOfDeviceConnection);
        // }
    });
    // When disconnect
    socket.on('disconnecting', async function (reason) {
        console.log('socket disconnecting...', socket.id, reason)
        const channelId = await redis.getDel(`channel-typing/user/${email}`);

        try {
            await redis.sPop(`channel-typing/${channelId}`, email);
            const typingUser = await redis.sMembers(`channel-typing/${channelId}`) || [];
            debug.socket("DISCONNECTING.TYPING", `Emitter: ${email}. Channel: ${channelId}. TypingList: ${typingUser}`);

            await redis.del(`users/online/${email}`);

            io.to(channelId).emit("chat/untyping", {
                typingUsersId: typingUser,
                senderId: email,
                channelId: parseInt(channelId) || channelId,
            });
        } catch (e) {
            // await redis.
            debug.socket("DISCONNECTING.TYPING", `Emitter: ${email}. Channel: ${channelId}. Error: ${e.message}`, "ERROR");
            io.to(`${channelId}`).emit("chat/untyping", {
                typingUsersId: [],
                senderId: email,
                channelId: parseInt(channelId) || channelId,
            });
        }
        // TODO: Call API to update user status when they offline
        // TODO: Emit status update to other users when this user is offline
    });
    socket.on('error', function (err) {
        console.log('received error from socket:', socket.id)
        debug.socket("RUNTIME.ERROR", `Emitter: ${email}. Error: ${JSON.stringify(err)}`, "ERROR");
    });
}