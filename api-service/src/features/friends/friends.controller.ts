import { Express } from "express";
const Constants = require("../../common/constants");
const service = require("./friends.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/friends/getAll", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id  = req.user.id;

        debug.api("GET /friends/getAll", `SenderId: ${JSON.stringify(id)}.`);
        try {
            const friends = await service.getAllByUserId(id);
            debug.api("GET /friends/getAll", `Friends: ${JSON.stringify(friends)}`);
            return res.status(200).json({
                message: null,
                data: friends,
                success: true,
            })
        } catch (e) {
            debug.api("GET /friends/getAll", `SenderId: ${JSON.stringify(id)}. Error: ${JSON.stringify(e.message)}`, "ERROR");
            return res.status(200).json({
                message: e.message,
                data: null,
                success: false,
            })
        }
    });
    app.get("/friends/search", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id  = req.user.id;

        const { searchText = "", pageSize = Constants.PAGE_LIMIT } = req.query;

        debug.api("GET /friends/search", `SenderId: ${JSON.stringify(id)}.`);
        debug.api("GET /friends/search", `Query params: ${JSON.stringify(req.query)}.`);
        try {
            const friends = await service.searchUsers({ id, searchText, pageSize });
            debug.api("GET /friends/search", `Friends: ${JSON.stringify(friends)}`);
            return res.status(200).json({
                message: null,
                data: friends,
                success: true,
            })
        } catch (e) {
            debug.api("GET /friends/search", `Error: ${JSON.stringify(e.message)}`, "ERROR");
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

        debug.api("POST /friends/unfriend", `SenderId: ${JSON.stringify(user.id)}`);
        debug.api("POST /friends/unfriend", `OtherUserId: ${JSON.stringify(receiverId)}`);
        try {
            const channel = await service.unFriend({ userId1: user.id, userId2: receiverId});
            debug.api("POST /friends/unfriend", `Friend channel: ${JSON.stringify(channel)}`);
            return res.status(200).json({
                message: null,
                data: channel,
                success: true,
            })
        } catch (e) {
            debug.api("POST /friends/unfriend", `Error: ${JSON.stringify(e.message)}`, "ERROR");
            return res.status(200).json({
                message: e.message,
                data: null,
                success: false,
            })
        }
    });
};
