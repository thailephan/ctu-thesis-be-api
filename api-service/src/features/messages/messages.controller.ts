import { Express } from "express";
const service = require("./messages.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/channels/:id/messages/getAll", middleware.verifyToken, async (req,res) => {
        const { id: channelId } = req.params;
        const messages = await service.getAll({channelId});

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
        const { channelId, messageTypeId, message, replyForMessageId } = req.body;

        // validate input
        if (Helpers.isNullOrEmpty(messageTypeId)) {
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

        try {
            // Save to database
            const newMesssage = await service.createMessage({ channelId, messageTypeId, message, replyForMessageId });
            return res.status(200).json({
                data: newMesssage,
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
};