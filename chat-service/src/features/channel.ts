import {Server} from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {OverrideSocket, IService, IRedis} from "../common/interface";
const Helpers = require("../common/helpers");
const debug = require("../common/debugger");

module.exports = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
                  socket: OverrideSocket,
                  service: IService,
                  redis: IRedis) => {
    // TODO: Tạo nhóm
    socket.on("channel/create", async ({ userIds, channelName, channelAvatar }) => {
        const result = await service.api.post("/channels/create-group-channel", {
            userIds,
            channelName,
            channelAvatar,
        });
        if (result.data.success) {
            const channel = result.data.data;
            // TODO: Join sockets of users into new channel id
            io.in(userIds.map(id => "users/" + id)).socketsJoin(channel.id.toString());
            // TODO: Emit event channel/create
            io.to(channel.id.toString()).emit("channel/create", {
                channel,
                memberIds: userIds,
            });
        } else {
            socket.emit("channel/create/error", result.data.message);
        }
    });
    // TODO: Đổi thông tin nhóm - update information
    // Name, AvatarUrl
    socket.on("channel/update-information", async ({ channelName, channelId, channelAvatarUrl }) => {
        const result = await service.api.post("/channels/update-information", {
            channelId,
            channelName,
            channelAvatarUrl,
        });
        if (result.data.success) {
            const channel = result.data.data;
            // TODO: Emit event channel/create
            io.to(channelId.toString()).emit("channel/update-information", { channel });
        } else {
            socket.emit("channel/create/error", result.data.message);
        }
    });
    // Xóa bỏ nhóm
    socket.on("channel/dissolve", async ({  }) => { });

    /* CHANNEL MEMBER */
    // Mời vào nhóm
    socket.on("channel/member/invite", async ({ userIds }) => { });
    // Join nhóm
    socket.on("channel/member/join", async ({  }) => { });
    // Rời nhóm
    socket.on("channel/member/leave", async ({  }) => { });
    // Rời nhóm
    socket.on("channel/member/kick-out", async ({  }) => { });

    /* CHANNEL HOST */
    socket.on("channel/host/change", async ({ newHostId, channelId }) => { });
}