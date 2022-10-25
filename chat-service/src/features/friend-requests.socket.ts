import {Server, Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

const debug = require("../common/debugger");
const { users_sockets } = require("../mock-data");
let { friend_requests, friendships } = require("../mock-data");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socket:  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    socket.on('friend/request/send', function (friendRequest) {
        const now = (new Date()).getTime();
        const { id_receiver } = friendRequest;
        const friend_request = {
            id_sender: socket.data.user.id,
            id_receiver,
            created_at: now,
            updated_at: now,
            status: 1,
        };
        friend_requests.push(friend_request);

        const receiver_socket_id = users_sockets.get(id_receiver);
        const emitter_socket_id = users_sockets.get(socket.data.user.id);

        debug.websocket('friend/request/send: %O', {
            friend_requests,
        });

        io.to([receiver_socket_id, emitter_socket_id]).emit('friend/request/send', {
            emitter: socket.data.user,
            action: 'send',
            friend_request,
        });
    });
    socket.on('friend/request/cancel', function (friendRequest) {
        const { id_receiver } = friendRequest;

        const friend_request_index = friend_requests.findIndex((fr) => fr.id_sender === socket.data.user.id && fr.id_receiver === id_receiver);
        if (friend_request_index === -1){
            return;
        }
        const friend_request = friend_requests[friend_request_index];
        friend_requests = [...friend_requests.slice(0, friend_request_index), ...friend_requests.slice(friend_request_index + 1)];

        debug.websocket('friend/request/cancel: %O', {
            friend_requests,
        });

        const receiver_socket_id = users_sockets.get(id_receiver);
        const emitter_socket_id = users_sockets.get(socket.data.user.id);

        io.to([receiver_socket_id, emitter_socket_id]).emit('friend/request/cancel', {
            emitter: socket.data.user,
            action: 'cancel',
            friend_request,
        });
    });
    socket.on('friend/request/accept', function (friendRequest) {
        const now = new Date().getTime();
        const { id_sender } = friendRequest;

        const friend_request_index = friend_requests.findIndex(fr => fr.id_sender === id_sender && fr.id_receiver === socket.data.user.id);
        if (friend_request_index === -1) {
           return;
        }
        const friend_request = friend_requests[friend_request_index];
        friend_requests = [...friend_requests.slice(0, friend_request_index), ...friend_requests.slice(friend_request_index + 1)];

        const sender_socket_id = users_sockets.get(id_sender);
        const emitter_socket_id = users_sockets.get(socket.data.user.id);

        const friendship = {...friend_request, created_at: now, updated_at: now};

        debug.websocket('friend/request/accept: %O', {
            friend_request,
            action: 'accept',
            friendship,
        });

        friendship.push(friendship);
        io.to([]).emit("friend/request/accept", {
           emitter: socket.data.user,
        });
    });
    socket.on('friend/request/reject', function (friendRequest) {
        const { id_sender } = friendRequest;
    });
}