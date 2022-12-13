import {Server} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {IRedis, IService, OverrideSocket} from "../common/interface";
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
                  socket: OverrideSocket,
                  service: IService,
                  redis: IRedis) => {
    socket.on("invitation/send", async ({ receiverId }) => {
        const user = socket.currentUser;
        const result = await service.api.post("/invitations/inviteUserId", {
            id: receiverId,
        });
        try {
            if (result.data.success) {
                io.to(["users/" + receiverId, "users/" + user.id]).emit("invitation/send", { emitterId: user.id, receiverId: receiverId });
            } else {
                socket.emit("invitation/send/error", result.data.message);
            }
        } catch (e) {
            socket.emit("invitation/send/error", result.data.message);
        }
    });
    socket.on("invitation/reject", async ({ senderId }) => {
        const user = socket.currentUser;

        const result = await service.api.post("/invitations/delete", {
            id: senderId,
        });

        if (result.data.success) {
            io.to(["users/" + senderId, "users/" + user.id]).emit("invitation/reject", { emitterId: user.id, senderId });
        } else {
            socket.emit("invitation/reject/error", result.data.message);
        }
    });
    socket.on("invitation/cancel", async ({ receiverId }) => {
        const user = socket.currentUser;

        const result = await service.api.post("/invitations/delete", {
            id: receiverId,
        });

        if (result.data.success) {
            io.to(["users/" + receiverId, "users/" + user.id]).emit("invitation/cancel", { senderId: user.id, receiverId: receiverId });
        } else {
            socket.emit("invitation/cancel/error", result.data.message);
        }
    });
    socket.on("invitation/accept", async ({ senderId }) => {
        const user = socket.currentUser;

        const result = await service.api.post("/invitations/accept", {
            id: senderId,
        });

        if (result.data.success) {
            io.to(["users/" + senderId, "users/" + user.id]).emit("invitation/accept", { emitterId: user.id, senderId });
            console.log("Join A", socket.rooms);
            io.in([user.id, senderId].map(id => "users/" + id)).socketsJoin(result.data.data.id.toString());
            console.log("Join B", socket.rooms);
        } else {
            socket.emit("invitation/accept/error", result.data.message);
        }
    });
}