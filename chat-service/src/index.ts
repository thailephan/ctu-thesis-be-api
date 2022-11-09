import {DefaultEventsMap} from "socket.io/dist/typed-events";

require("dotenv").config();
import { createServer } from "http";
// import axios from "axios";
import jwt from 'jsonwebtoken';
const httpServer = createServer();
import { Server, Socket } from "socket.io";

const debug = require("./common/debugger");
const Helpers = require("./common/helpers");
const config = require("../config");

interface OverrideSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>{
    currentUser?: any;
}

const io = new Server(httpServer, {
    cors: {
        origin: "*",
    }
});

io.use((socket: OverrideSocket, next) => {
    const token = socket.handshake.auth.accessToken || socket.handshake.headers["access-token"];
    if (Helpers.isNullOrEmpty(token)) {
        return next(new Error("Token bị rỗng"));
    }
    jwt.verify(token, config.token.access_token_secret, (err: any, decoded: any) => {
        if (err) {
            debug.middleware(err)
            return next(new Error("access token không đúng"));
        } else {
            socket.currentUser = decoded;
            // TODO: Load channels of connected user
            // TODO: Join users to channels
            const roomIds = channels.map(r => `${r.id}`);
            console.log(decoded.id, roomIds);
            socket.join(roomIds);
            next();
        }
    });
});

// const userid_socket = new Map();
io.on("connection", (socket: OverrideSocket) => {
    // console.log(socket.currentUser);
    console.log('socket connect...', socket.id);
    // console.log(channels);
    socket.emit("chat/channel/sync", {channels: channels});

    /* Common event */
    // When disconnect
    socket.on('disconnect', function (reason) {
        console.log('socket disconnect...', socket.id, reason)
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

    /* CHAT */
    socket.on("chat/message/send", ({channelId, message, replyForId, messageTypeId}) => {
        // TODO: check user in channel or not
        console.log({message, replyForId, channelId, messageTypeId});
        console.log(messages);
        const channelMessages = messages.get(channelId.toString()) || [];
        if (Helpers.isNullOrEmpty(message)) {
            socket.emit("chat/message/send", { error: "Tin nhắn không được trống", success: false });
            return;
        } else {
            // TODO: Check if current size of room with channelId is > 2, then set msg status is true
            // const numOnlineUsers = io.sockets.adapter.rooms.get(`${channelId}`).size;
            // TODO: Save data to database and read back
            const replyMessage = channelMessages.find(m => m.id.toString() === replyForId?.toString());
            const newMessage = {
                id: channelMessages.length + 1,
                channelId: `${channelId}`,
                createdAt: (new Date()).getTime(),
                createdBy: socket.currentUser.id,
                messageTypeId,
                message,
                status: 1, // 1 is sent, 2 is received, 3 is seen, -1 is deleted
                replyMessage,
                senderFullName: socket.currentUser.fullName,
                senderAvatarUrl: socket.currentUser.avatarUrl,
            };
            channelMessages.push(newMessage);
            messages.set(channelId.toString(), channelMessages);

            io.to(`${channelId}`).emit("chat/message/send", {
                channelId,
                message: {
                    senderId: socket.currentUser.id,
                    username: socket.currentUser.fullName,
                    avatarUrl: socket.currentUser.avatarUrl,
                    ...newMessage
                },
            });
        }
    });
    socket.on("chat/message/received", ({messageId, channelId}) => {
        // TODO: if status of message is === 2 then do nothing
        // TODO: Update status of message with id = *messageId* and has channel's id = *channelId*
        // TODO: Update readMembers of message to load how many user has read that messages
        // TODO: Emit event to channel id
        socket.broadcast.to(`${channelId}`).emit("chat/message/received", {
            messageId,
            channelId,
            responseUserId: socket.currentUser.id,
            responseUserAvatarUrl: socket.currentUser.avatarUrl,
        });
    });
    socket.on("chat/message/seen", ({messageId, channelId}) => {
        // TODO: Update status of message with id = *messageId* and has channel's id = *channelId*
        // TODO: Update readMembers of message to load how many user has read that messages
        // TODO: Emit event to channel id
        io.to(`${channelId}`).emit("chat/message/seen", { // TODO: change `io` back to `socket.broadcast` later
            messageId,
            channelId,
            responseUserId: socket.currentUser.id,
            responseUserAvatarUrl: socket.currentUser.avatarUrl,
        });
    });
    socket.on("chat/message/sync", ({channelId}) => {
        // TODO: Call api to get message of channel with id and return back
        socket.emit("chat/message/sync", {channelId, messages: [...messages.values()]});
    })
    /* TYPING */
    const channelTyping = new Map<string, Set<number>>();
    socket.on("chat/typing", ({channelId}) => {
        const ok = channelTyping.get(`${channelId}`).add(socket.currentUser.id);
        if (ok) {
            io.to(`${channelId}`).emit("chat/typing", {
                typingIds: channelTyping.get(`${channelId}`).values(),
                fromId: socket.currentUser.id,
            });
        } else {
            // TODO: Emit back to emitter
        }
    });
    socket.on("chat/untyping", ({channelId}) => {
        const ok = channelTyping.get(`${channelId}`).delete(socket.currentUser.id);
        if (ok) {
            io.to(`${channelId}`).emit("chat/untyping", {
                typingIds: channelTyping.get(`${channelId}`).values(),
                fromId: socket.currentUser.id,
            });
        } else {
            // TODO: Emit back to emitter
        }
    });


    // Friend / Base
    // socket.on('friend/base/unfriend', function () {
    //
    // });
    // require("./features/chat.socket")(io, socket);
    //
    // // Friend / Request
    // require("./features/invitations.socket")(io, socket);
    //
    // // # Chat / base / typing
    // require("./features/typing.socket")(io, socket);
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

/* Constants */

const users = [{"id":1,"fullName":"Thai Le","registerTypeId":1,"hash":"$2a$10$ZCeiJJGIh0f9j5lTip9VW.Vu.C.jw6ah8wxzKm5RF7WuFr7s2QWqa","tempHash":null,"email":"thailephanminh1@gmail.com","birthday":null,"gender":null,"phoneNumber":null,"avatarUrl":null,"status":1,"createdAt":"2022-11-03T15:17:39.332772","updatedAt":"2022-11-03T15:17:39.332772","createdBy":null,"updatedBy":null,"onlineStatus":null,"lastOnlineTime":null},
 {"id":2,"fullName":"Sang Phan","registerTypeId":1,"hash":"$2a$10$nPD2M9RH7GdVP46q4VFaAeMz.WoNUR6hjsAP.hh5TOIMyHg68kP4q","tempHash":null,"email":"phansang@gmail.com","birthday":null,"gender":null,"phoneNumber":null,"avatarUrl":null,"status":1,"createdAt":"2022-11-03T16:59:23.685694","updatedAt":"2022-11-03T16:59:23.685694","createdBy":null,"updatedBy":null,"onlineStatus":null,"lastOnlineTime":null},
 {"id":3,"fullName":"Anh Le","registerTypeId":1,"hash":"$2a$10$9BRdsFY/nTGjPddp4.dkZeO6eFkheEOGgLhC5.Y8Za/e3Mv8FQhY.","tempHash":null,"email":"quocanhle@gmail.com","birthday":null,"gender":null,"phoneNumber":null,"avatarUrl":null,"status":1,"createdAt":"2022-11-03T18:00:01.354334","updatedAt":"2022-11-03T18:00:01.354334","createdBy":null,"updatedBy":null,"onlineStatus":null,"lastOnlineTime":null},
 {"id":4,"fullName":"Tuấn Trần Quốc","registerTypeId":1,"hash":"$2a$10$ZCeiJJGIh0f9j5lTip9VW.Vu.C.jw6ah8wxzKm5RF7WuFr7s2QWqa","tempHash":null,"email":"quoctuan.tran@gmail.com","birthday":null,"gender":null,"phoneNumber":null,"avatarUrl":null,"status":1,"createdAt":"2022-11-04T16:39:47.617062","updatedAt":"2022-11-04T16:39:47.617062","createdBy":null,"updatedBy":null,"onlineStatus":null,"lastOnlineTime":null},
 {"id":5,"fullName":"Lưu Tinh Vũ","registerTypeId":1,"hash":"$2a$10$ZCeiJJGIh0f9j5lTip9VW.Vu.C.jw6ah8wxzKm5RF7WuFr7s2QWqa","tempHash":null,"email":"tinhvu99@gmail.com","birthday":null,"gender":null,"phoneNumber":null,"avatarUrl":null,"status":1,"createdAt":"2022-11-04T16:39:47.681094","updatedAt":"2022-11-04T16:39:47.681094","createdBy":null,"updatedBy":null,"onlineStatus":null,"lastOnlineTime":null},
 {"id":6,"fullName":"Phong Ánh","registerTypeId":1,"hash":"$2a$10$ZCeiJJGIh0f9j5lTip9VW.Vu.C.jw6ah8wxzKm5RF7WuFr7s2QWqa","tempHash":null,"email":"anhphong@gmail.com","birthday":null,"gender":null,"phoneNumber":null,"avatarUrl":null,"status":1,"createdAt":"2022-11-04T16:39:47.734982","updatedAt":"2022-11-04T16:39:47.734982","createdBy":null,"updatedBy":null,"onlineStatus":null,"lastOnlineTime":null}];

const accessToken =[
    {id: 1, value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZnVsbE5hbWUiOiJUaGFpIExlIiwicmVnaXN0ZXJUeXBlSWQiOjEsImVtYWlsIjoidGhhaWxlcGhhbm1pbmgxQGdtYWlsLmNvbSIsImJpcnRoZGF5IjpudWxsLCJnZW5kZXIiOm51bGwsInBob25lTnVtYmVyIjpudWxsLCJhdmF0YXJVcmwiOm51bGwsInN0YXR1cyI6MSwiY3JlYXRlZEF0IjoiMjAyMi0xMS0wM1QwODoxNzozOS4zMzJaIiwidXBkYXRlZEF0IjoiMjAyMi0xMS0wM1QwODoxNzozOS4zMzJaIiwiY3JlYXRlZEJ5IjpudWxsLCJ1cGRhdGVkQnkiOm51bGwsInJlZ2lzdGVyVHlwZSI6ImVtYWlsL3Bhc3N3b3JkIiwiaWF0IjoxNjY3NTMwMjAzfQ.o1Doq8JO3sDiwgNduPpXHXRAtJgJKeq8CncnOoqqJ6Y"},
    {id: 2, value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MiwiZnVsbE5hbWUiOiJTYW5nIFBoYW4iLCJyZWdpc3RlclR5cGVJZCI6MSwiZW1haWwiOiJwaGFuc2FuZ0BnbWFpbC5jb20iLCJiaXJ0aGRheSI6bnVsbCwiZ2VuZGVyIjpudWxsLCJwaG9uZU51bWJlciI6bnVsbCwiYXZhdGFyVXJsIjpudWxsLCJzdGF0dXMiOjEsImNyZWF0ZWRBdCI6IjIwMjItMTEtMDNUMDk6NTk6MjMuNjg1WiIsInVwZGF0ZWRBdCI6IjIwMjItMTEtMDNUMDk6NTk6MjMuNjg1WiIsImNyZWF0ZWRCeSI6bnVsbCwidXBkYXRlZEJ5IjpudWxsLCJyZWdpc3RlclR5cGUiOiJlbWFpbC9wYXNzd29yZCIsImlhdCI6MTY2NzUzMDI0Nn0.nqPHzxFrMek2GUwOxi7Bgsw9QduE4mkKm1b8X9g0yRI"},
    {id: 2, value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MywiZnVsbE5hbWUiOiJBbmggTGUiLCJyZWdpc3RlclR5cGVJZCI6MSwiaGFzaCI6IiQyYSQxMCQ5QlJkc0ZZL25UR2pQZGRwNC5ka1plTzZlRmtoZUVPR2dMaEM1Llk4WmEvZTNNdjhGUWhZLiIsInRlbXBIYXNoIjpudWxsLCJlbWFpbCI6InF1b2NhbmhsZUBnbWFpbC5jb20iLCJiaXJ0aGRheSI6bnVsbCwiZ2VuZGVyIjpudWxsLCJwaG9uZU51bWJlciI6bnVsbCwiYXZhdGFyVXJsIjpudWxsLCJzdGF0dXMiOjEsImNyZWF0ZWRBdCI6IjIwMjItMTEtMDNUMTg6MDA6MDEuMzU0MzM0IiwidXBkYXRlZEF0IjoiMjAyMi0xMS0wM1QxODowMDowMS4zNTQzMzQiLCJjcmVhdGVkQnkiOm51bGwsInVwZGF0ZWRCeSI6bnVsbCwib25saW5lU3RhdHVzIjpudWxsLCJsYXN0T25saW5lVGltZSI6bnVsbH0.dLLuE1VdYWhn8CNrUeXqsfgskjD9UFUZ_Z52PRfDLaY"},
];

const channels = [{"id":1,"channelTypeId":1,"status":1,"createdAt":"2022-11-05T15:12:45.476545"},
 {"id":2,"channelTypeId":2,"status":1,"createdAt":"2022-11-05T15:12:45.513632"},
 {"id":3,"channelTypeId":1,"status":1,"createdAt":"2022-11-05T15:12:45.553667"},
 ];

const channelMembers = [{"channelId":1,"memberId":1,"joinAt":"2022-11-05T15:13:11.388375","invitedBy":null,"status":1},
 {"channelId":1,"memberId":2,"joinAt":"2022-11-05T15:13:11.427342","invitedBy":null,"status":1},
 {"channelId":3,"memberId":1,"joinAt":"2022-11-05T15:13:11.457457","invitedBy":null,"status":1},
 {"channelId":3,"memberId":3,"joinAt":"2022-11-05T15:13:11.499647","invitedBy":null,"status":1},
 {"channelId":2,"memberId":1,"joinAt":"2022-11-05T17:05:22.123106","invitedBy":null,"status":1},
 {"channelId":2,"memberId":2,"joinAt":"2022-11-05T17:05:22.160148","invitedBy":null,"status":1},
 {"channelId":2,"memberId":3,"joinAt":"2022-11-05T17:05:22.206937","invitedBy":1,"status":1}];

const messages = new Map<any, any[]>([]);

