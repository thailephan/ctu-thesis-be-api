import { Express } from "express";
const service = require("./room-members.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const { filterGetList } = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/room-members/get_by_user_id/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const roomMembers = await service.getByUserId(id);
            debug.debugger(`/room-members/${id} result`, JSON.stringify(roomMembers));
            if (!roomMembers) {
                throw Error(`Not found with id: ${id}`);
            }

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: roomMembers,
            });
        } catch (e) {
            debug.debugger(`/room-members/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
};
