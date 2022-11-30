import { Server } from "socket.io";
import { DefaultEventsMap } from "socket.io/dist/typed-events";
import { IRedis, IService, OverrideSocket } from "../common/interface";
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
                  socket: OverrideSocket,
                  service: IService,
                  redis: IRedis) => {
    // Gửi tin nhắn vào nhóm với channenId
    socket.on("chat/message/send", async ({ channelId, message, replyForId, messageTypeId, clientSentAt }) => {
        // TODO: check user in channel or not
        console.log({ message, replyForId, channelId, messageTypeId, clientSentAt });
        if (Helpers.isNullOrEmpty(message)) {
            socket.emit("chat/message/send/error", { error: "Tin nhắn không được trống", success: false });
            return;
        } else {
            // TODO: Save data to database and read back
            const newMessage = {
                channelId: channelId,
                messageTypeId,
                message,
                // status: 1, // 1 is sent, 2 is received, 3 is seen, -1 is deleted
                replyForId,
            };

            const result = await service.api.post("/messages", newMessage);
            debug.socket("/chat/message/send api log", result.data);
            if (result.data.success) {
                io.to(`${channelId}`).emit("chat/message/send", {
                    channelId,
                    clientSentAt,
                    emitterId: socket.currentUser.id,
                    senderFullName: socket.currentUser.fullName,
                    senderAvatarUrl: socket.currentUser.avatarUrl,
                    message: {
                        ...result.data.data,
                    },
                });
            } else {
                socket.emit("chat/message/send/error", result.data.message);
            }
        }
    });
    // Xử lý status của message
    socket.on("chat/message/received", ({messageId, channelId}) => {
        // TODO: Update readMembers of message to load how many user has read that messages - not enough time
        // TODO: Emit event to channel id
        io.to(`${channelId}`).emit("chat/message/received", {
            messageId,
            channelId,
            emitterId: socket.currentUser.id,
        });
    });
    socket.on("chat/message/seen", async ({messageId, channelId}) => {
        // TODO: Update readMembers of message to load how many user has read that messages
        await service.api.post("/messages/seen", { messageId, channelId });
        // TODO: Emit event to channel id
        io.to(`${channelId}`).emit("chat/message/seen", {
            messageId,
            channelId,
            emitterId: socket.currentUser.id,
        });
    });
    socket.on("chat/message/remove", async ({ messageId, channelId }) => {
        // TODO: Call api to set status of message to -1
        const result = await service.api.post("/messages/delete", {
            messageId, channelId
        });
        if (result.data.success) {
            io.to(channelId.toString()).emit("chat/message/remove", {
                messageId, channelId,
                emitterId: socket.currentUser.id,
            })
        } else {
            socket.emit("chat/mesasge/remove/error", result.data.message);
        }
    });
}