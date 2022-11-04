import { Express } from "express";
const service = require("./invitations.service");
const debug = require("../../common/debugger");
const middleware = require("../../middleware");
const Helpers = require("../../common/helpers");
const { filterGetList } = require("../../middleware");

// Get all friend request (*)
// Create friend request to another user with id (1)
// Get all friend request of user id (2)
// Remove friend request of specified user id 1, and user id 2 (3)

module.exports = (app: Express) => {
    app.get("/invitations/getAll", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id = req.user.id;
        debug.api("invitations/getAll", id);

        try {
            const invitations = await service.getAllByUserId(id);
            return res.status(200).json({
                message: null,
                data: invitations,
                success: true,
            });
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                data: null,
                success: false,
            });
        }
    });

    // TODO: SENDER API
    app.post("/invitations/inviteUserId", middleware.verifyToken, async (req, res) => {
        const { id: receiverId = "" } = req.body;
        // @ts-ignore
        const senderId = req.user.id;

        if (Helpers.isNullOrEmpty(receiverId)) {
            return res.status(200).json({
                message: "Không tìm thấy id của người nhận",
                data: null,
                success: false,
            });
        }
        if (!Helpers.isNullOrEmpty(await service.isBothAreFriends(senderId, parseInt(receiverId)))) {
            return res.status(200).json({
                message: "Đã là bạn bè, không thể gửi lời mời kết bạn",
                data: null,
                success: false,
            });
        }
        try {
            const newInvitation = await service.createInvitation(senderId, parseInt(receiverId));

            return res.status(200).json({
                data: newInvitation,
                success: true,
                message: null,
            });
        } catch (e) {
            return res.status(200).json({
                data: null,
                success: false,
                message: e.message,
            });
        }
    });
    app.post("/invitations/cancel", middleware.verifyToken, (req, res) => {
    });

    // TODO: Receiver API
    app.post("/invitations/accept", middleware.verifyToken, (req, res) => {
    });
    app.post("/invitations/reject", middleware.verifyToken, (req, res) => {
    });
};