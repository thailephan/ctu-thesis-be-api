import {Server} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {IRedis, IService, OverrideSocket} from "../common/interface";

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
                  socket: OverrideSocket,
                  service: IService,
                  redis: IRedis) => {
    const user = socket.currentUser;
    const userId = socket.currentUser.id;

    socket.on("user/updateAvatar", async ({ avatarUrl }) => {
        const user = socket.currentUser;
        try {
            const result = await service.api.post("/users/updateAvatar", {
                avatarUrl,
            });
            if (result.data.success) {
                io.to(`users/${user.id}`).emit("user/updateAvatar", { avatarUrl });
            } else {
                socket.emit("user/updateAvatar/failed", result.data.message);
            }
        } catch (e) {
            socket.emit("user/updateAvatar/error", e.message);
        }
    });
    socket.on("user/updateInformation", async (data) => {
        const user = socket.currentUser;
        try {
            const result = await service.api.post("/users/update", data);
            if (result.data.success) {
                io.to(`users/${user.id}`).emit("user/updateInformation", result.data.data);
            } else {
                socket.emit("user/updateInformation/failed", result.data.message);
            }
        } catch (e) {
            socket.emit("user/updateInformation/error", e.message);
        }
    });
    socket.on("user/delete", () => {
        const user = socket.currentUser;
    });
}