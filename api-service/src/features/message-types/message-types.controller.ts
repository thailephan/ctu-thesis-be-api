import { Express } from "express";
const service = require("./message-types.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = (app: Express) => {
    app.get("/admin/message-types/getAll", async (req, res) => {
        try {
            const messageTypes = await service.getAll();

            return res.status(200).json({
                message: null,
                success: true,
                data: messageTypes,
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
