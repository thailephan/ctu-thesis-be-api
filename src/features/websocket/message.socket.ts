import { Socket } from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

module.exports = (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    socket.on("delete_message", args => {
        console.log(args);
    })
    socket.on("send_message", args => {
        console.log(args);
    })
}

// - delete_message
// - send_message
