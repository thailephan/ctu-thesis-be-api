import { Express } from "express";
const service = require("./messages.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const { filterGetList } = require("../../middleware");

module.exports = (app: Express) => {
    // API for unread mesasges of user in _rooms
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

    app.get("/messages/get_list", filterGetList, async (req, res) => {
        // room_id, user_id, offset
        const room_id = req.body.room_id;
        const limit = parseInt(req.query.limit as string);
        const start_read_message = parseInt(req.query.start_read_message as string);
        debug.debugger(`/messages/get_list query`, JSON.stringify({ room_id, limit, start_read_message }));

        // TODO: Check user_id, room_id is undefined or not

        try {
            // Handle get mesasges
            const messages = await service.getAll({room_id, limit, start_read_message});
            const message_total = await service.count(room_id);
            const has_more_message = message_total > start_read_message + limit;

            debug.debugger(`/messages/get_list success`, {messages});

            res.status(200).json({
                success: true,
                statusCode: 200,
                data: {
                    items: messages,
                    room: {
                        room_id,
                        message_total,
                        has_more_message,
                    }
                },
            });
        } catch (e) {
            debug.api(e);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                error: e.message
            });
        }
    });
    app.post("/messages/create", async (req, res) => {
        const { sender_id, room_id, message_type_id } = req.body;

        try {
            // TODO: verify sender_id, room_id, content existed
            if (!Helpers.isNumberId(sender_id)) {
                throw Error(`Invalid sender_id`);
            }
            if (!Helpers.isNumberId(message_type_id)) {
                throw Error(`Invalid message_type_id`);
            }
            if (Helpers.isNullOrEmpty(room_id)) {
                throw Error(`Invalid room_id`);
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