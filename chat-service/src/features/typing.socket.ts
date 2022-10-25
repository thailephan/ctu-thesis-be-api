const debug = require("../common/debugger");
const { room_typing } = require("../mock-data");

module.exports = (socket) => {
    socket.on('chat/base/typing', function (data) {
        const {room_id} = data;
        const _room_id = room_id.toString();
        // Cause room id is string so value of key in map should be string for easier to process
        const old_typing = room_typing.get(_room_id) || [];

        if (old_typing.some(t => t.id === socket.data.user.id)) {
            return;
        }

        const new_typing = [...old_typing, socket.data.user];
        room_typing.set(_room_id, new_typing);

        debug.websocket({
            typing: {
                room_id: _room_id,
                old: old_typing,
                new: new_typing,
            }
        });

        socket.emit('chat/base/typing/ack', {
            status: 200,
            success: true,
            data: null
        });
        socket.to(_room_id).emit('chat/base/typing', {
            status: 200,
            success: true,
            data: new_typing,
        });
    });
    socket.on('chat/base/untyping', function (data) {
        const {room_id} = data;
        const _room_id = room_id.toString();
        const old_typing = room_typing.get(_room_id) || [];

        const new_typing = old_typing.filter(u => u.id !== socket.data.user.id);
        room_typing.set(_room_id, new_typing);

        debug.websocket({
            untyping: {
                room_id: _room_id,
                old: old_typing,
                new: new_typing,
            }
        });
        socket.emit('chat/base/untyping/ack', {
            status: 200,
            success: true,
            data: null
        });
        socket.to(_room_id).emit('chat/base/typing', {
            status: 200,
            success: true,
            data: new_typing
        });
    });
}