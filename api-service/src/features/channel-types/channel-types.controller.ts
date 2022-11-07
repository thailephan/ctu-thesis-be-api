import { Express } from "express";
const service = require("./channel-types.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = (app: Express) => {
    app.get("/admin/channel-types/getAll", async (req, res) => {
        try {
            const channelTypes = await service.getAll();

            return res.status(200).json({
                message: null,
                success: true,
                data: channelTypes,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
};
