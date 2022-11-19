import {DefaultEventsMap} from "socket.io/dist/typed-events";
import path from "path";

require("dotenv").config({
    path: process.env.NODE_ENV === "development_local" ? path.resolve(process.cwd(), '.env.local.development') : path.resolve(process.cwd(), '.env'),
});

import { createServer } from "http";
// import axios from "axios";
import jwt from 'jsonwebtoken';
const httpServer = createServer();
import { Server, Socket } from "socket.io";
import axios from "axios";

const debug = require("./common/debugger");
const Helpers = require("./common/helpers");
const config = require("../config");

interface OverrideSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>{
    currentUser?: any;
    accessToken?: string;
}

const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

io.use((socket: OverrideSocket, next) => {
    const token = socket.handshake.auth.accessToken || socket.handshake.headers["access-token"];
    console.log("Has connect");
    if (Helpers.isNullOrEmpty(token)) {
        return next(new Error("Token bị rỗng"));
    }
    jwt.verify(token, config.token.accessTokenSecret, async (err: any, decoded: any) => {
        if (err) {
            debug.middleware(err);
            return next(new Error("access token không đúng"));
        } else {
            const instance = axios.create({
                baseURL: config.apiService.URL,
                timeout: 1000,
                headers: {
                    authorization: `Bearer ${token}`
                }
            });

            socket.currentUser = decoded;
            socket.accessToken = token;
            // TODO: Load channels of connected user
            try {
                const result = await instance.get("/channels/getAll");
                if (result.data.success) {
                    // TODO: Join users to channels
                    const roomIds = result.data.data.map(r => `${r.id}`);
                    console.log(roomIds);
                    socket.join([...roomIds, "users/" + decoded.id]);
                } else {
                    socket.emit("error", "Unable to load instance");
                }
            } catch (e) {
                socket.emit("error", e.message);
            }
            next();
        }
    });
});

// const userid_socket = new Map();
io.on("connection", async (socket: OverrideSocket) => {
    // console.log(socket.currentUser);
    console.log('socket connect...', socket.id);

    const instance = axios.create({
        baseURL: config.apiService.URL,
        timeout: 1000,
        headers: {
            authorization: `Bearer ${socket.accessToken}`
        }
    });
    /* PING connect */
    socket.on("ping", () => {
        console.log("client ping");
        socket.emit("pong");
    });
    // socket.emit("chat/channel/sync", {channels: channels});
    /* Common event */

    socket.on('disconnect', async function (reason) {
        console.log('socket disconnect...', socket.id, reason)
    })
    // When disconnect
    socket.on('disconnecting', async function (reason) {
        console.log('socket disconnecting...', socket.id, reason)
        const result = await axios.post("http://localhost:4001/channels/untypingByUser", null, {
            headers: {
                authorization: `Bearer ${socket.accessToken}`
            }
        });
        if (result.data.success) {
            const channelId = result.data.data.channelId;
            io.to(`${channelId}`).emit("chat/untyping", {
                typingUsersId: result.data.data.typingList,
                senderId: socket.currentUser.id,
                channelId: channelId,
            });
        }
        // TODO: Call API to update user status when they offline
        // TODO: Emit status update to other users when this user is offline
        // handleDisconnect()
    });
    socket.on('error', function (err) {
        console.log('received error from socket:', socket.id)
        console.log(err)
    });

    /* Client event */
    // socket.on("chat/sync", () => {
    // });
    // TODO: handled on auth middleware above
    // socket.on("chat/rooms/getAll", () => {
    //     // TODO: Get all rooms of user and get its last mesasge
    //     const rooms = [];
    //     socket.emit("chat/rooms/getAll", rooms);
    // });
    socket.on("user/updateAvatar", async ({ avatarUrl }) => {
        const user = socket.currentUser;
        socket.broadcast.to(`users/${user.id}`).emit("user/updateAvatar", { avatarUrl });
    })
    socket.on("user/updateInformation", async (data) => {
        const user = socket.currentUser;
        socket.broadcast.to(`users/${user.id}`).emit("user/updateInformation", data);
    })

    /* CHAT */
    // Gửi tin nhắn vào nhóm với channenId
    socket.on("chat/message/send", async ({ channelId, message, replyForId, messageTypeId }) => {
        // TODO: check user in channel or not
        console.log({ message, replyForId, channelId, messageTypeId });
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

            const result = await instance.post("/messages", newMessage);
            debug.socket("/chat/message/send api log", result.data);
            if (result.data.success) {
                io.to(`${channelId}`).emit("chat/message/send", {
                    channelId,
                    senderId: socket.currentUser.id,
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
            senderId: socket.currentUser.id,
        });
    });
    socket.on("chat/message/seen", async ({messageId, channelId}) => {
        // TODO: Update readMembers of message to load how many user has read that messages
        await instance.post("/messages/seen", { messageId, channelId });
        // TODO: Emit event to channel id
        io.to(`${channelId}`).emit("chat/message/seen", {
            messageId,
            channelId,
            senderId: socket.currentUser.id,
        });
    });
    socket.on("chat/message/remove", async ({ messageId, channelId }) => {
        // TODO: Call api to set status of message to -1
        const result = await instance.post("/messages/delete", {
            messageId, channelId
        });
        if (result.data.success) {
            io.to(channelId.toString()).emit("chat/message/remove", {
                messageId, channelId,
                senderId: socket.currentUser.id,
            })
        } else {
            socket.emit("chat/mesasge/remove/error", result.data.message);
        }
    });

    /* TYPING */
    socket.on("chat/typing", async ({channelId}) => {
        try {
            const result = await axios.get(`http://localhost:4001/channels/${channelId}/typing`, {
                headers: {
                    authorization: `Bearer ${socket.accessToken}`
                }
            })
            console.log(result.data);
            if (result.data.success) {
                io.to(`${channelId}`).emit("chat/typing", {
                    typingUsersId: result.data.data.typingList,
                    senderId: socket.currentUser.id,
                    channelId,
                });
            }
        } catch (e) {
            socket.emit("chat/typing/error", {
                message: "không biết lỗi gì",
                senderId: socket.currentUser.id,
            });
        }
    });
    socket.on("chat/untyping", async ({channelId}) => {
        try {
            const result = await axios.get(`http://localhost:4001/channels/${channelId}/untyping`, {
                headers: {
                    authorization: `Bearer ${socket.accessToken}`
                }
            })
            if (result.data.success) {
                io.to(`${channelId}`).emit("chat/untyping", {
                    typingUsersId: result.data.data.typingList,
                    senderId: socket.currentUser.id,
                    channelId,
                });
            }
        } catch (e) {
            socket.emit("chat/typing/error", {
                message: "không biết lỗi gì",
                senderId: socket.currentUser.id,
            });
        }
    });

    /* USER */
    socket.on("user/delete", () => {
        const user = socket.currentUser;
    });

    /* FRIEND */
    socket.on("invitation/send", async ({ receiverId }) => {
        const user = socket.currentUser;

        const result = await instance.post("/invitations/inviteUserId", {
            id: receiverId,
        });

        if (result.data.success) {
            io.to("users/" + receiverId).emit("invitation/send", { senderId: user.id, receiverId: receiverId });
            socket.emit("invitation/send", { senderId: user.id, receiverId: receiverId })
        } else {
            socket.emit("invitation/send/error", result.data.message);
        }
    });
    // For both sender cancel and receiver reject
    socket.on("invitation/cancel", async ({ receiverId }) => {
        const user = socket.currentUser;

        const result = await instance.post("/invitations/delete", {
            id: receiverId,
        });

        if (result.data.success) {
            io.to("users/" + receiverId).emit("invitation/cancel", { senderId: user.id, receiverId: receiverId });
            socket.emit("invitation/cancel", { senderId: user.id, receiverId: receiverId });
        } else {
            socket.emit("invitation/cancel/error", result.data.message);
        }
    });
    socket.on("invitation/accept", async ({ senderId, receiverId }) => {
        const user = socket.currentUser;

        const result = await instance.post("/invitations/accept", {
            id: receiverId,
        });

        if (result.data.success) {
            io.to("users/" + receiverId).emit("invitation/accept", { senderId: user.id, receiverId: receiverId });
            socket.emit("invitation/accept", { senderId: user.id, receiverId: receiverId })
            console.log("Join A", socket.rooms);
            io.in([user.id, receiverId].map(id => "users/" + id)).socketsJoin(result.data.data.id.toString());
            console.log("Join B", socket.rooms);
        } else {
            socket.emit("invitation/accept/error", result.data.message);
        }
    });

    /* FRIEND */
    socket.on("friend/unfriend", async ({ receiverId }) => {
        const user = socket.currentUser;

        const result = await instance.post("/friends/unfriend", {
            receiverId,
        });
        if (result.data.success) {
            io.to("users/" + receiverId).emit("friend/unfriend", { senderId: user.id, receiverId: receiverId, channelId: result.data.data.id });
            socket.emit("friend/unfriend", { senderId: user.id, receiverId: receiverId, channelId: result.data.data.id });
            console.log("Leave A", socket.rooms);
            io.in([user.id, receiverId].map(id => "users/" + id)).socketsLeave(result.data.data.id.toString());
            console.log("Leave B", socket.rooms);
        } else {
            socket.emit("friend/unfriend/error", result.data.message);
        }
    });

    /* CHANNEL */
    // TODO: Tạo nhóm
    socket.on("channel/create", async ({ userIds, channelName, channelAvatar }) => {
        const result = await instance.post("/channels/create-group-channel", {
            userIds,
            channelName,
            channelAvatar,
        });
        if (result.data.success) {
           const channel = result.data.data;
           // TODO: Join sockets of users into new channel id
            io.in(userIds.map(id => "users/" + id)).socketsJoin(channel.id.toString());
           // TODO: Emit event channel/create
            io.to(channel.id.toString()).emit("channel/create", {
                channel,
                memberIds: userIds,
            });
        } else {
            socket.emit("channel/create/error", result.data.message);
        }
    });
    // TODO: Đổi thông tin nhóm - update information
    // Name, AvatarUrl
    socket.on("channel/update-information", async ({ channelName, channelId, channelAvatarUrl }) => {
        const result = await instance.post("/channels/update-information", {
            channelId,
            channelName,
            channelAvatarUrl,
        });
        if (result.data.success) {
            const channel = result.data.data;
            // TODO: Emit event channel/create
            io.to(channelId.toString()).emit("channel/update-information", { channel });
        } else {
            socket.emit("channel/create/error", result.data.message);
        }
    });
    // Xóa bỏ nhóm
    socket.on("channel/dissolve", async ({  }) => { });

    /* CHANNEL MEMBER */
    // Mời vào nhóm
    socket.on("channel/member/invite", async ({ userIds }) => { });
    // Join nhóm
    socket.on("channel/member/join", async ({  }) => { });
    // Rời nhóm
    socket.on("channel/member/leave", async ({  }) => { });
    // Rời nhóm
    socket.on("channel/member/kick-out", async ({  }) => { });

    /* CHANNEL HOST */
    socket.on("channel/host/change", async ({ newHostId, channelId }) => { });
});

httpServer.listen(config.server.PORT, () => {
    debug.debugger("server:listener", `Server is listening at ${config.server.PORT}`)
});


/*
 # User - Status
 user/status/online
 user/status/offline

 # Chat
 chat/base/message/send
 chat/base/message/receive
 chat/base/message/see
 # chat/base/message/remove

 # chat/base/message/reaction

 chat/base/message/typing
 chat/base/message/un-typing

 # Chat - Group
 chat/group/base/create
 chat/group/base/dissolve
 chat/group/base/join
 chat/group/base/leave
 chat/group/base/change-name

 # Chat - Group - Member
 chat/group/member/add
 chat/group/member/remove
 chat/group/member/reaction

 # Chat - Group - Role
 chat/group/roles/host/change

 # Friend
 friend/base/unfriend

 # Friend - Request
 friend/request/send
 friend/request/cancel
 friend/request/reject
 friend/request/accept
 */
