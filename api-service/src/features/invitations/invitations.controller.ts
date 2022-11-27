import { Express } from "express";
const service = require("./invitations.service");
const debug = require("../../common/debugger");
const middleware = require("../../middleware");
const Helpers = require("../../common/helpers");

// Get all friend request (*)
// Create friend request to another user with id (1)
// Get all friend request of user id (2)
// Remove friend request of specified user id 1, and user id 2 (3)

module.exports = (app: Express) => {
    app.get("/invitations/getAll", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id = req.user.id;

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
    app.get("/invitations/getAllSent", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id = req.user.id;

        try {
            const invitations = await service.getAllSentByUserId({ id });
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
    app.get("/invitations/getAllReceived", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const id = req.user.id;

        try {
            const invitations = await service.getAllReceivedByUserId({ id });
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
    app.post("/invitations/delete", middleware.verifyToken, async (req, res) => {
        const { id: userId2 = "" } = req.body;
        // @ts-ignore
        const userId1 = req.user.id;

        if (Helpers.isNullOrEmpty(userId2)) {
            return res.status(200).json({
                message: "Id không hợp lệ",
                data: null,
                success: false,
            });
        }
        if (userId2 === userId1) {
            return res.status(200).json({
                message: "request user's id không được trùng với body.id",
                data: null,
                success: false,
            });
        }
        try {
            await service.deleteInvitation(userId1, parseInt(userId2));

            return res.status(200).json({
                data: null,
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

    // TODO: Receiver API
    app.post("/invitations/accept", middleware.verifyToken, async (req, res) => {
        // TODO: start transaction
        // TODO: remove invitations
        // TODO: add friends relationship to `friends` table *returning `*`*
        // TODO: return friend data row after finish
        const { id: userId2 = "" } = req.body;
        // @ts-ignore
        const userId1 = req.user.id;

        if (Helpers.isNullOrEmpty(userId2)) {
            return res.status(200).json({
                message: "Id không hợp lệ",
                data: null,
                success: false,
            });
        }
        if (userId2 === userId1) {
            return res.status(200).json({
                message: "request user's id không được trùng với body.id",
                data: null,
                success: false,
            });
        }
        try {
            const channel = await service.addFriend(userId1, parseInt(userId2));

            return res.status(200).json({
                data: channel,
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

    app.post("/friends/areFriendWith", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const user = req.user;
        const { otherUserId } = req.body;

        if (Helpers.isNullOrEmpty(otherUserId)) {
            return res.status(200).json({
                message: "Id không hợp lệ",
                data: null,
                success: false,
            });
        }

        try {
            if (!Helpers.isNullOrEmpty(await service.isBothAreFriends(user.id, otherUserId))) {
                return res.status(200).json({
                    message: "Là bạn bè",
                    data: {
                        areFriend: true,
                    },
                    success: true,
                })
            } else {
                return res.status(200).json({
                    message: "Không là bạn bè",
                    data: {
                        areFriend: false,
                    },
                    success: true,
                })
            }
        } catch (e) {
            return res.status(200).json({
                message: e.message,
                data: null,
                success: false,
            })
        }
    });
};
