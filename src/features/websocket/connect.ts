import {Server, Socket} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
    io.on("connection", (socket:  Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
        // socket.on("private message", (anotherSocketId: string, msg: string) => {
        //     console.log(anotherSocketId, msg);
        //     socket.to(anotherSocketId).emit("private message", socket.id, msg);
        // });
        require("./friend.socket")(socket);
        require("./group.socket")(socket);
        require("./message.socket")(socket);
    });
}
