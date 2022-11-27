import { Express } from "express";
const service = require("./channel-types.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = (app: Express) => {
    app.get("/admin/channel-types/getAll", async (req, res) => {
        try {
            const channelTypes = await service.getAll();

            debug.api("GET /admin/channel-types/getAll", `${JSON.stringify(channelTypes)}`);
            return res.status(200).json({
                message: null,
                success: true,
                data: channelTypes,
            });
        } catch (e) {
            debug.api("GET /admin/channel-types/getAll", `Failed to get all channel types`, "ERROR");
            return res.status(200).json({
                message: e.message,
                statusCode: 500,
                success: false,
                data: null,
            });
        }
    });
};
