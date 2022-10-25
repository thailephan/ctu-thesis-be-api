import { Socket, Server } from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import axios from "axios";

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>, socket: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    socket.on("chat/message/send", async (message: any) => {
        const now = (new Date()).getTime();
        message.room_id = message.room_id.toString();

        try {
            // Add to database
            const data = {
                    room_id: message.room_id,
                    sender_id: socket.data.user.id,
                    content: message.content,
                    message_type_id: message.type,
                };
            console.log(data);
            const res = await axios.post("http://127.0.0.1:4001/messages/create", data);

            socket.emit("chat/message/send/ack", {...res.data, sender: socket.data.user});

            // Update room tables - message_total
            socket.to(message.room_id).emit("chat/message/receive", {...res.data, sender: socket.data.user});
        } catch (e) {
            console.log(e.message);
        }
    });
    socket.on("chat/base/message/received", (args) => {
        //  Increase current message of user
    });
    socket.on("chat/base/message/seen", (args) => {
        //  Increase current message of user
    });

    socket.on("delete_message", args => {
        console.log(args);
    })
    socket.on("send_message", args => {
        console.log(args);
    })
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

// - delete_message
// - send_message
