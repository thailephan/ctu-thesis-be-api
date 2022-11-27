import { Express } from "express";
const service = require("./message-types.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = (app: Express) => {
    app.get("/admin/message-types/getAll", async (req, res) => {
        try {
            const messageTypes = await service.getAll();

            debug.api("GET /admin/message-types/getAll", `${JSON.stringify(messageTypes)}`);
            return res.status(200).json({
                message: null,
                success: true,
                data: messageTypes,
            });
        } catch (e) {
            debug.api("GET /admin/message-types/getAll", `Failed to get all message types`, "ERROR");
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
};
