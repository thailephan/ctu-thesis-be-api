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
        // @ts-ignore
        const userId = req.user.id;
        try {
            const channels = await service.getAllFriendChannels(userId);

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
    // TODO: add restrict for only user in channel be able get data
    app.get("/channels/getAllMembersIdByChannelId", middleware.verifyToken, async (req, res) => {
        const { channelId } = req.body;
        // @ts-ignore
        const senderId = req.user.id;

        if (Helpers.isNullOrEmpty(channelId)) {
            return res.status(200).json({
                message: "Channel id rỗng",
                success: false,
                data: null,
            });
        }

        try {
            const channelsWithMembersId = await service.getAllMembersIdByChannelId(channelId, senderId);

            if (Helpers.isNullOrEmpty(channelsWithMembersId)) {
                return res.status(200).json({
                    message: "Channel không tồn tại hoặc đã bị xóa",
                    success: false,
                    data: null,
                });
            }

            return res.status(200).json({
                message: null,
                success: true,
                data: channelsWithMembersId,
            });
        } catch(e) {
            return res.status(200).json({
                message: e.message,
                success: false,
                data: null,
            });
        }
    });
    app.post("/channels/create", middleware.verifyToken, async (req, res) => {
        const { users, channelTypeId, channelName, channelAvatarUrl } = req.body;

        try {
        } catch (e) {
        }
    });
    app.post("/channels/addMemberToChannel", middleware.verifyToken, async (req, res) => {
        const { users, channelTypeId, channelName, channelAvatarUrl } = req.body;

        try {
        } catch (e) {
        }
    });
    app.post("/channels/removeMemberFromChannel", middleware.verifyToken, async (req, res) => {
        const { users, channelTypeId, channelName, channelAvatarUrl } = req.body;
        try {
        } catch (e) {
        }
    });
    app.post("/channels/leaveChannel", middleware.verifyToken, async (req, res) => {
        const { users, channelTypeId, channelName, channelAvatarUrl } = req.body;

        try {
        } catch (e) {
        }
    });
};