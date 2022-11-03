require("dotenv").config();
import axios from "axios";
import { createServer } from "http";

const httpServer = createServer();
import { Server } from "socket.io";

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        credentials: true,
    }
});
const debug = require("./common/debugger");
const config = require("./../config");
const { users_sockets } = require("./mock-data");

// const userid_socket = new Map();
io.on("connection", (socket) => {
    console.log('socket connect...', socket.id);

    socket.on("init", async (data) => {
        const {userId} = data;

        try {
            const res = await axios.get(`http://127.0.0.1:4001/users/getById/${userId}`);
            if (!res.data.success) {
                debug.socket(res.data.errorMessage);
            }
            const user = res.data.data;

            const roomResponse = await axios.get(`http://127.0.0.1:4001/rooms/getByUserId/${userId}`);
            if (!roomResponse.data.success) {
                debug.socket(roomResponse.data.errorMessage);
            }
            const rooms = roomResponse.data.data;

            rooms.forEach(v => socket.join(v.id));

            users_sockets.set(user.id, socket.id);

            console.log(socket.rooms);

            socket.data= {
                user
            };
            socket.emit("init/ack", {
                rooms
            });
        } catch (e) {
            console.log(e);
        }
    });

    // chat/base/message/see
    socket.on('joinRoom', (roomObj, user) => {
        console.log(roomObj, user);
        // const user = {room: "a"};
        socket.join(roomObj.room_id);
        socket.broadcast
            .to(roomObj.room_id)
            .emit(
                'message/new-member-added',
                `${user?.fullName} has joined the call`
            );
        // io.to(user.room).emit('roomUsers', {
        //     room: user.room,
        //     users: 1
        // });
        // io.to(user.room).emit('roomSettings', {
        //     ...roomObject
        // });
    });

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

    // Friend / Base
    // socket.on('friend/base/unfriend', function () {
    //
    // });
    require("./features/chat.socket")(io, socket);
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
