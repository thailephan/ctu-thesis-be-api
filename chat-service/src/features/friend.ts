import {Server} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {IRedis, IService, OverrideSocket} from "../common/interface";
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
                  socket: OverrideSocket,
                  service: IService,
                  redis: IRedis) => {
    socket.on("friend/unfriend", async ({ receiverId }) => {
        const user = socket.currentUser;

        const result = await service.api.post("/friends/unfriend", {
            receiverId,
        });
        if (result.data.success) {
            io.to(["users/" + receiverId, "users/" + user.id]).emit("friend/unfriend", { senderId: user.id, receiverId: receiverId, channelId: result.data.data.id });
            io.in([user.id, receiverId].map(id => "users/" + id)).socketsLeave(result.data.data.id.toString());
        } else {
            socket.emit("friend/unfriend/error", result.data.message);
        }
    });
}