import { Express } from "express";
const service = require("./users.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const { filterGetList } = require("../../middleware");

module.exports = (app: Express) => {
    app.get("/users/getList", filterGetList, async (req, res) => {
        let page = parseInt(req.query.page as string);
        const size = parseInt(req.query.size as string);
        const search = req.query.search;
        const sort = req.query.sort;

        // TODO: verify size > 0, page > 0, search (!= number), sort abc (ASC, name DESC)

        const {offset, limit} = Helpers.pageToOffsetLimit({page, size});
        debug.debugger(`/users/getList query`, JSON.stringify({size, page, search, sort, offset, limit}));

        try {
            const users = await service.getAll({offset, limit, search, sort});
            const totalCount = await service.count({search});
            const totalPage = size > 0 ? Math.ceil(totalCount / size) : 1;
            debug.debugger(`/users/getList success`, JSON.stringify({size, page, search, sort, totalPage}));

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    items: users ?? [],
                    size: size,
                    page: page,
                    totalPage,
                    totalCount: totalCount,
                    hasPrevious: page > 1 && page <= totalPage,
                    hasNext: page < totalPage,
                }
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
    app.get("/users/getById/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const user = await service.getById(id);
            debug.debugger(`/users/getById/${id} result`, JSON.stringify(user));
            if (!user) {
                throw Error(`Not found with id: ${id}`);
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: user,
            });
        } catch (e) {
            debug.debugger(`/users/getById/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    app.get("/users/getByDepartmentId/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const users = await service.getByDepartmentId(id);
            debug.debugger(`/users/getByDepartmentId/${id} result`, JSON.stringify(users));
            if (!users) {
                throw Error(`Not found with id: ${id}`);
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: users,
            });
        } catch (e) {
            debug.debugger(`/users/getByDepartmentId/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    app.get("/users/getByClassId/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const users = await service.getByClassId(id);
            debug.debugger(`/users/getByClassId/${id} result`, JSON.stringify(users));
            if (!users) {
                throw Error(`Not found with id: ${id}`);
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: users,
            });
        } catch (e) {
            debug.debugger(`/users/getByClassId/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    app.get("/users/getByCollegeId/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const users = await service.getByCollegeId(id);
            debug.debugger(`/users/getByCollegeId/${id} result`, JSON.stringify(users));
            if (!users) {
                throw Error(`Not found with id: ${id}`);
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: users,
            });
        } catch (e) {
            debug.debugger(`/users/getByCollegeId/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    app.get("/users/getByCourseId/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const users = await service.getByCollegeId(id);
            debug.debugger(`/users/getByCourseId/${id} result`, JSON.stringify(users));
            if (!users) {
                throw Error(`Not found with id: ${id}`);
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: users,
            });
        } catch (e) {
            debug.debugger(`/users/getByCourseId/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });

    // app.post("/users/create", async (req, res) => {
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
    //         debug.debugger("/users/create success", result);
    //         return res.status(201).json({
    //             success: true,
    //             statusCode: 201,
    //             data: result,
    //         });
    //     } catch (e) {
    //         debug.debugger("/users/create error", e.message);
    //         res.status(400).json({
    //             statusCode: 400,
    //             success: false,
    //             errorMessage: e.message,
    //         })
    //         return;
    //     }
    // });
    // TODO: Update, Delete
};