import { Express } from "express";
const service = require("./friends.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/friends/getAll", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id  = req.user.id;
        debug.api("friends/getAll", id);

        try {
            const friends = await service.getAllByUserId(id);
            return res.status(200).json({
                message: null,
                data: friends,
                success: true,
            })
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                data: null,
                success: false,
            })
        }
    });
    app.post("/friends/unfriend", middleware.verifyToken, async (req, res) => {
        const receiverId = req.body.receiverId;
        // @ts-ignore
        const user = req.user;

        try {
            const channel = await service.unFriend({ userId1: user.id, userId2: receiverId});
            return res.status(200).json({
                message: null,
                data: channel,
                success: true,
            })
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                data: null,
                success: false,
            })
        }
    });
};
