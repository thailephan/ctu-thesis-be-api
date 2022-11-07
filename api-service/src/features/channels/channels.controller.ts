import { Express } from "express";
const service = require("./channels.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/admin/channels/getAll", middleware.verifyToken, async (req, res) => {
        try {
            const channels = await service.getAll();

            return res.status(200).json({
                message: null,
                success: true,
                data: channels,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
    app.get("/admin/channels/getById/:id", middleware.verifyToken, async (req, res) => {
        if (Helpers.isNullOrEmpty(req.params.id)) {
            return res.status(200).json({
                message: "Id rỗng",
                success: false,
                data: null,
            });
        }
        try {
            const channels = await service.getByChannelId(req.params.id);

            return res.status(200).json({
                message: null,
                success: true,
                data: channels,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
    app.get("/channels/getAll", middleware.verifyToken , async (req, res) => {
        // @ts-ignore
        const id = req.user.id;

        try {
            const channels = await service.getAllByUserId({id});

            return res.status(200).json({
                message: null,
                success: true,
                data: channels,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
    app.get("/channels/:id/members/getAll", middleware.verifyToken , async (req, res) => {
        // @ts-ignore
        const id = req.params.id || "";

        try {
            const channelMembers = await service.getAllChannelMembersByChannelId(id);

            return res.status(200).json({
                message: null,
                success: true,
                data: channelMembers,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
    app.get("/channels/getAllFriendChannels", middleware.verifyToken, async (req, res) => {
        try {
            const channels = await service.getAllFriendChannels(1);

            return res.status(200).json({
                message: null,
                success: true,
                data: channels,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    })
};