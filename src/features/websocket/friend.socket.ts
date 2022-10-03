import { Socket } from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

module.exports = (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    socket.on("send_friend_request", args => {
        console.log(args);
    })
    socket.on("accept_friend_request", args => {
        console.log(args);
    })
    socket.on("cancel_friend_request", args => {
        console.log(args);
    })

    socket.on("delete_friend", args => {
        console.log(args);
    })
}

// - delete_friend
// - send_friend_request
// - accept_friend_request
// - cancel_friend_request
