import { Express } from "express";
const service = require("./rooms.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const { filterGetList } = require("../../middleware");

module.exports = (app: Express) => {
    // app.get("/rooms/get_list", filterGetList, async (req, res) => {
    //     let page = parseInt(req.query.page as string);
    //     const size = parseInt(req.query.size as string);
    //     const search = req.query.search;
    //     const sort = req.query.sort;
    //
    //     // TODO: verify size > 0, page > 0, search (!= number), sort abc (ASC, name DESC)
    //
    //     const {offset, limit} = Helpers.pageToOffsetLimit({page, size});
    //     debug.debugger(`/rooms/get_list query`, JSON.stringify({size, page, search, sort, offset, limit}));
    //
    //     try {
    //         const rooms = await service.getAll({offset, limit, search, sort});
    //         const totalCount = await service.count({search});
    //         const totalPage = size > 0 ? Math.ceil(totalCount / size) : 1;
    //         debug.debugger(`/rooms/get_list success`, JSON.stringify({size, page, search, sort, totalPage}));
    //
    //         return res.status(200).json({
    //             statusCode: 200,
    //             success: true,
    //             data: {
    //                 items: rooms ?? [],
    //                 size: size,
    //                 page: page,
    //                 totalPage,
    //                 totalCount: totalCount,
    //                 hasPrevious: page > 1 && page <= totalPage,
    //                 hasNext: page < totalPage,
    //             }
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
    app.get("/rooms/getByUserId/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`User id không hợp lệ`);
            }

            const rooms = await service.getByUserId(id);
            debug.debugger(`/rooms/getByUserId/${id} result`, JSON.stringify(rooms));
            if (!rooms) {
                throw Error("Không tìm thấy cuộc trò chuyện");
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: rooms,
            });
        } catch (e) {
            debug.debugger(`/rooms/getByUserId/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    // TODO: GET ROOM BY ID AND USER ID TO GET CORRECT ROOM NAME
    app.get("/rooms/getById/:id", async (req, res) => {
        const id = req.params.id;
        const { userId } = { userId: 1 };

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Id không hợp lệ`);
            }

            const room = await service.getById({userId, id});
            debug.debugger(`/rooms/getById/${id} result`, JSON.stringify(room));
            if (!room) {
                throw Error("Không tìm thấy cuộc trò chuyện");
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: room,
            });
        } catch (e) {
            debug.debugger(`/rooms/getById/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    // app.get("/rooms/get_by_department_id/:id", async (req, res) => {
    //     const id = req.params.id;
    //
    //     try {
    //         if (isNaN(parseInt(id))) {
    //             throw Error(`Invalid id`);
    //         }
    //
    //         const rooms = await service.getByDepartmentId(id);
    //         debug.debugger(`/rooms/department_id/${id} result`, JSON.stringify(rooms));
    //         if (!rooms) {
    //             throw Error(`Not found with id: ${id}`);
    //         }
    //         return res.status(200).json({
    //             statusCode: 200,
    //             success: true,
    //             data: rooms,
    //         });
    //     } catch (e) {
    //         debug.debugger(`/rooms/department_id/${id} error`, e.message);
    //         return res.status(400).json({
    //             success: false,
    //             statusCode: 400,
    //             errorMessage: e.message,
    //         });
    //     }
    // });
    // app.get("/rooms/get_by_class_id/:id", async (req, res) => {
    //     const id = req.params.id;
    //
    //     try {
    //         if (isNaN(parseInt(id))) {
    //             throw Error(`Invalid id`);
    //         }
    //
    //         const rooms = await service.getByClassId(id);
    //         debug.debugger(`/rooms/class_id/${id} result`, JSON.stringify(rooms));
    //         if (!rooms) {
    //             throw Error(`Not found with id: ${id}`);
    //         }
    //         return res.status(200).json({
    //             statusCode: 200,
    //             success: true,
    //             data: rooms,
    //         });
    //     } catch (e) {
    //         debug.debugger(`/rooms/class_id/${id} error`, e.message);
    //         return res.status(400).json({
    //             success: false,
    //             statusCode: 400,
    //             errorMessage: e.message,
    //         });
    //     }
    // });
    // app.get("/rooms/get_by_college_id/:id", async (req, res) => {
    //     const id = req.params.id;
    //
    //     try {
    //         if (isNaN(parseInt(id))) {
    //             throw Error(`Invalid id`);
    //         }
    //
    //         const rooms = await service.getByCollegeId(id);
    //         debug.debugger(`/rooms/college_id/${id} result`, JSON.stringify(rooms));
    //         if (!rooms) {
    //             throw Error(`Not found with id: ${id}`);
    //         }
    //         return res.status(200).json({
    //             statusCode: 200,
    //             success: true,
    //             data: rooms,
    //         });
    //     } catch (e) {
    //         debug.debugger(`/rooms/college_id/${id} error`, e.message);
    //         return res.status(400).json({
    //             success: false,
    //             statusCode: 400,
    //             errorMessage: e.message,
    //         });
    //     }
    // });
    // app.get("/rooms/get_by_course_id/:id", async (req, res) => {
    //     const id = req.params.id;
    //
    //     try {
    //         if (isNaN(parseInt(id))) {
    //             throw Error(`Invalid id`);
    //         }
    //
    //         const rooms = await service.getByCollegeId(id);
    //         debug.debugger(`/rooms/course_id/${id} result`, JSON.stringify(rooms));
    //         if (!rooms) {
    //             throw Error(`Not found with id: ${id}`);
    //         }
    //         return res.status(200).json({
    //             statusCode: 200,
    //             success: true,
    //             data: rooms,
    //         });
    //     } catch (e) {
    //         debug.debugger(`/rooms/course_id/${id} error`, e.message);
    //         return res.status(400).json({
    //             success: false,
    //             statusCode: 400,
    //             errorMessage: e.message,
    //         });
    //     }
    // });
    // app.post("/rooms/create", async (req, res) => {
    //     const {email, full_name, phone_number, class_id} = req.body;
    //     try {
    //         // TODO: verify email, full_name, birthday, gender, phone_number, class_id, created_by, updated_by
    //         if (email && !Helpers.isEmail(email)) {
    //             throw Error(`Invalid email`);
    //         }
    //         if (phone_number && !Helpers.isPhoneNumber(phone_number)) {
    //             throw Error(`Invalid phone_number`);
    //         }
    //         // TODO: handle these field later
    //         // const class_result = await service.getClassById(class_id);
    //         // if (Helpers.isNullOrEmpty(class_result)) {
    //         //     throw Error(`Invalid class_id`);
    //         // }
    //
    //         const result = await service.create(req.body);
    //
    //         debug.debugger("/chat-rooms/create success", result);
    //         return res.status(201).json({
    //             success: true,
    //             statusCode: 201,
    //             data: result,
    //         });
    //     } catch (e) {
    //         debug.debugger("/chat-rooms/create error", e.message);
    //         res.status(400).json({
    //             statusCode: 400,
    //             success: false,
    //             errorMessage: e.message,
    //         })
    //         return;
    //     }
    // });
    // TODO: Update, Delete

//    TODO: CHAT ROOMs
    app.get("/room-members/getByRoomId/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            debug.debugger(`/room-members/${id} userid`, id);

            const roomMembers = await service.getRoomMembersByRoomId(id);
            debug.debugger(`/room-members/${id} result`, JSON.stringify(roomMembers));
            if (!roomMembers) {
                throw Error(`Not found with id: ${id}`);
            }

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: roomMembers,
            });
        } catch (e) {
            debug.debugger(`/room-members/getByUserId/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
};