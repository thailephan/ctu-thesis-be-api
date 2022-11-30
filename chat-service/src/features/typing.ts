import {Server} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {IRedis, IService, OverrideSocket} from "../common/interface";
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
                  socket: OverrideSocket,
                  service: IService,
                  redis: IRedis) => {
    const user = socket.currentUser;
    const userId = socket.currentUser.id.toString();
    socket.on("chat/typing", async ({channelId}) => {
        try {
            await redis.sAdd(`channel-typing/${channelId}`, userId);
            await redis.set(`channel-typing/user/${userId}`, channelId);
            const typingUser = await redis.sMembers(`channel-typing/${channelId}`);
            debug.socket("TYPING", `List of typing: '${JSON.stringify(typingUser)}' in channel ${channelId}. Typing: ${userId}`)

            io.to(`${channelId}`).emit("chat/typing", {
                typingUsersId: typingUser,
                emitterId: user.id,
                channelId,
            });
        } catch (e) {
            debug.socket("TYPING", `Error: ${e.message}. Channel ${channelId}. User id: ${userId}`, "ERROR")
            io.to(`${channelId}`).emit("chat/typing", {
                typingUsersId: [],
                emitterId: user.id,
                channelId,
            });
        }
    });
    socket.on("chat/untyping", async ({channelId}) => {
        try {
            await redis.del(`channel-typing/user/${userId}`);
            await redis.sPop(`channel-typing/${channelId}`, userId);
            const typingUser = await redis.sMembers(`channel-typing/${channelId}`);
            debug.socket("UNTYPING", `List of typing: '${JSON.stringify(typingUser)}' in channel ${channelId}. UnTyping: ${userId}`)

            io.to(`${channelId}`).emit("chat/untyping", {
                typingUsersId: typingUser,
                emitterId: user.id,
                channelId,
            });
        } catch (e) {
            console.log(e.message);
            debug.socket("UNTYPING", `Error: ${e.message}. Channel ${channelId}. User id: ${userId}`, "ERROR")
            io.to(`${channelId}`).emit("chat/untyping", {
                typingUsersId: [],
                emitterId: user.id,
                channelId,
            });
        }
    });
}