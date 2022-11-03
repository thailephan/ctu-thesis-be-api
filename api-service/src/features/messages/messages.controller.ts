import { Express } from "express";
const service = require("./messages.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
// const { filterGetList } = require("../../middleware");

const BEGINNING_MESSAGE = 1;
const LATEST_MESSAGE = undefined;

module.exports = (app: Express) => {
    // API for unread mesasges of user in chat-rooms
    // Show room sorted by newest mesasge - pos: 7

    // TODO: handle search mesasge by text
    app.get("/messages/search", async (req, res) => {
        console.log(res);
        res.status(200).json({
            success: true,
            statusCode: 200,
            data: {},
        });
    });

    app.get("/messages/getNewMesasges", async (req, res) => {
            const from = parseInt(req.query.from as string) || BEGINNING_MESSAGE;
            const to = parseInt(req.query.to as string) || LATEST_MESSAGE;
            const roomId = req.body.roomId;

            debug.debugger("/messages/getNewMessages", JSON.stringify({ roomId, from, to }));

            try {
                const messages = await service.getNewMessages({roomId, from, to});

                return res.status(200).send({
                    data: messages,
                    status: 200,
                    success: true,
                });
            } catch (e) {
                debug.api(e);
                return res.status(400).json({
                    success: false,
                    statusCode: 400,
                    error: e.message
                });
            }
    })
    // })
    // app.get("/messages/getAll", async (req, res) => {
    //     // roomId, userId, from
    //     const from = parseInt(req.query.from as string) || "beginning";
    //     const roomId = req.body.roomId;
    //     const userId = req.body.userId;
    //
    //     debug.debugger(`/messages/getAll query`, JSON.stringify({ roomId, userId, from }));
    //
    //     // TODO: Check userId, roomId is undefined or not
    //     try {
    //         // Handle get mesasges
    //         const messages = await service.getAll({ roomId, userId, from });
    //         const hasMoreMessage = await service.hasMoreMessage({roomId, userId});
    //         const hasLeftMessage = await service.hasLeftMessage({roomId, userId});
    //
    //         debug.debugger(`/messages/get_list success`, {messages});
    //
    //         res.status(200).json({
    //             success: true,
    //             statusCode: 200,
    //             data: {
    //                 items: messages,
    //                 room: {
    //                     roomId,
    //                     message_total,
    //                     has_more_message,
    //                 }
    //             },
    //         });
    //     } catch (e) {
    //         debug.api(e);
    //         return res.status(400).json({
    //             success: false,
    //             statusCode: 400,
    //             error: e.message
    //         });
    //     }
    // });
    app.post("/messages/create", async (req, res) => {
        const { sender_id, roomId, message_type_id } = req.body;

        try {
            // TODO: verify sender_id, roomId, content existed
            if (!Helpers.isNumberId(sender_id)) {
                throw Error(`Invalid sender_id`);
            }
            if (!Helpers.isNumberId(message_type_id)) {
                throw Error(`Invalid message_type_id`);
            }
            if (Helpers.isNullOrEmpty(roomId)) {
                throw Error(`Invalid roomId`);
            }

            const result = await service.create(req.body);

            debug.debugger("/messages/create success", {
                result,
                message: req.body,
            });
            return res.status(201).json({
                success: true,
                statusCode: 201,
                data: result,
            });
        } catch (e) {
            debug.debugger("/messages/create error", e.message);
            res.status(400).json({
                statusCode: 400,
                success: false,
                errorMessage: e.message,
            })
            return;
        }
    });
    // app.put("/messages/updateById", async (req, res) => {
    //     const {name, course_id, college_id, status = 1} = req.body;
    //
    //     // TODO: verify course_id, college_id, name
    //     try {
    //         const result_id = await service.update({id, name, course_id, college_id, status});
    //         debug.debugger("/messages/create success", result_id);
    //         return res.status(201).json({
    //             success: true,
    //             data: {
    //                 id: result_id
    //             }
    //         });
    //     } catch (e) {
    //         debug.debugger("/messages/create error", e.message);
    //         res.status(400).json({
    //             success: false,
    //             errorMessage: e.name,
    //         })
    //         return;
    //     }
    // });
};