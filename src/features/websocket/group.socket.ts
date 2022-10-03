import { Socket } from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

module.exports = (socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    socket.on("create_room", args => {
        console.log(args);
    })
    socket.on("add_user", args => {
        console.log(args);
    })
    socket.on("delete_user", args => {
        console.log(args);
    })
    socket.on("dissolve", args => {
        console.log(args);
    })
    socket.on("promotion", args => {
        console.log(args);
    })
    socket.on("change_name", args => {
        console.log(args);
    })
    socket.on("leave", args => {
        console.log(args);
    })
}

// - create_room (nhóm)
// - add_user (nhóm)
// - delete_user (nhóm)
// - dissolve (nhóm)
// - promotion (nhóm)
// - change_name (nhóm)
// - leave (nhóm)
// - typing (option)
