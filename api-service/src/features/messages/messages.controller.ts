import { Express } from "express";
const service = require("./messages.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/channels/:id/messages/getAll", middleware.verifyToken, async (req,res) => {
        // @ts-ignore
        const userId = req.user.id;
        const { id: channelId } = req.params;

        const messages = await service.getAll({channelId, userId});

        return res.status(200).json({
            data: messages,
            success: true,
            message: false,
        })
    });
    // TODO: Send message
    // TODO: need senderId(userToken), need channelId, need messageTypeId, need message value, replyForMessageId
    app.post('/messages', middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const senderId = req.user.id;
        const { channelId, messageTypeId, message, replyForId, createdBy = senderId } = req.body;
        debug.api("/mesasges post log body", req.body);
        // validate input
        if (Helpers.isNullOrEmpty(messageTypeId)) {
            console.log(messageTypeId);
            return res.status(200).json({
                data: null,
                success: false,
                message: "'messageTypeId' không được để trống",
            });
        }
        if (Helpers.isNullOrEmpty(message)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'message' không được để trống",
            });
        }
        if (Helpers.isNullOrEmpty(channelId)) {
           return res.status(200).json({
                data: null,
                success: false,
                message: "'channelId' không được để trống",
           });
        }
        // TODO: Validate user in channel?
        // TODO: Validate replyForId with curernt msg id

        try {
            // Save to database
            const newMessage = await service.createMessage({ channelId, messageTypeId, message, replyForId, createdBy });

            if (newMessage) {
                if (typeof newMessage.createdAt === "string") {
                    newMessage.createdAt = parseInt(newMessage.createdAt);
                } else if (typeof newMessage.createdAt === "object") {
                    newMessage.createdAt = parseInt(newMessage.createdAt.low.toString());
                }
            }

            return res.status(200).json({
                data: newMessage,
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
    // TODO: Search message

    // TODO: Remove message (change status to -1)
    app.post("/messages/delete", middleware.verifyToken, async (req, res) => {
        const { messageId, channelId } = req.body;

        if (Helpers.isNullOrEmpty(messageId)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'messageId' không được để trống",
            });
        }
        if (Helpers.isNullOrEmpty(channelId)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'channelId' không được để trống",
            });
        }

        try {
            await service.deleteMessage({messageId, channelId});
            return res.status(200).json({
                success: true,
                message: null,
                data: null,
            });
        } catch (e) {
            return res.status(200).json({
                success: false,
                message: e.message,
                data: null,
            });
        }
    });

    app.post("/messages/seen", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const senderId = req.user.id;
        const { messageId, channelId } = req.body;

        if (Helpers.isNullOrEmpty(messageId)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'messageId' không được để trống",
            });
        }
        if (Helpers.isNullOrEmpty(channelId)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'channelId' không được để trống",
            });
        }

        try {
            const result = await service.updateMessageSeen({ userId: senderId, messageId, channelId });
            return res.status(200).json({
                success: true,
                data: {...result, channelId},
                message: null,
            });
        } catch (e) {
           return res.status(200).json({
               success: false,
               data: null,
               message: e.message,
           })
        }
    });
    app.post("/messages/received", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
       const userId = req.user.id;
       const { channelId, messageId } = req.body;

        if (Helpers.isNullOrEmpty(messageId)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'messageId' không được để trống",
            });
        }
        if (Helpers.isNullOrEmpty(channelId)) {
            return res.status(200).json({
                data: null,
                success: false,
                message: "'channelId' không được để trống",
            });
        }

        try {
           const result = await service.updateMessageReceived({ channelId, messageId, userId });

           return res.status(200).json({
               success: true,
               data: {...result, channelId},
               message: null,
           })
       } catch (e) {
           return res.status(200).json({
               success: false,
               data: null,
               message: e.message,
           })
       }
    });
};