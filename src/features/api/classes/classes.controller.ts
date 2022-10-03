import { Express } from "express";
const service = require("./classes.service");
const debug = require("../../../common/debugger");
const Helpers = require("../../../common/helpers");
const { filterGetList } = require("../../../middleware");

module.exports = (app: Express) => {
    app.get("/classes/get_list", filterGetList, async (req, res) => {
        let page = parseInt(req.query.page as string);
        const size = parseInt(req.query.size as string);
        const search = req.query.search;
        const sort = req.query.sort;

        // TODO: verify size > 0, page > 0, search (!= number), sort abc (ASC, name DESC)

        const {offset, limit} = Helpers.pageToOffsetLimit({page, size});
        debug.debugger(`/classes/get_list query`, JSON.stringify({size, page, search, sort, offset, limit}));

        try {
            const classes = await service.getAll({offset, limit, search, sort});
            const totalCount = await service.count({search});
            const totalPage = size > 0 ? Math.ceil(totalCount / size) : 1;
            debug.debugger(`/classes/get_list success`, JSON.stringify({size, page, search, sort, totalPage, totalCount}));

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    items: classes ?? [],
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
    app.get("/classes/get_by_id/:id", async (req, res) => {
        const id = req.params.id;

        try {
            if (isNaN(parseInt(id))) {
                throw Error(`Invalid id`);
            }

            const user = await service.getById(id);
            debug.debugger(`/classes/${id} result`, JSON.stringify(user));
            if (!user) {
                throw Error(`Not found with id: ${id}`);
            }
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: user,
            });
        } catch (e) {
            debug.debugger(`/classes/${id} error`, e.message);
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: e.message,
            });
        }
    });
    app.post("/classes/create", async (req, res) => {
        const {name, course_id, college_id, status = 1} = req.body;
        try {
        // TODO: verify course_id, college_id, name
            if (Helpers.isNullOrEmpty(name)) {
                throw Error(`Invalid name`);
            } else if(name.length !== 8) {
                throw Error(`'name' must be 8 length`);
            }
            if (isNaN(parseInt(course_id))) {
                throw Error(`Invalid course_id`);
            }
            if (isNaN(parseInt(college_id))) {
                throw Error(`Invalid college_id`);
            }

            const result = await service.create({name, course_id, college_id, status});

            debug.debugger("/classes/create success", result);
            return res.status(201).json({
                success: true,
                statusCode: 201,
                data: result,
            });
        } catch (e) {
            debug.debugger("/classes/create error", e.message);
            res.status(400).json({
                statusCode: 400,
                success: false,
                errorMessage: e.message,
            })
            return;
        }
    });
    // app.put("/classes/updateById", async (req, res) => {
    //     const {name, course_id, college_id, status = 1} = req.body;
    //
    //     // TODO: verify course_id, college_id, name
    //     try {
    //         const result_id = await service.update({id, name, course_id, college_id, status});
    //         debug.debugger("/classes/create success", result_id);
    //         return res.status(201).json({
    //             success: true,
    //             data: {
    //                 id: result_id
    //             }
    //         });
    //     } catch (e) {
    //         debug.debugger("/classes/create error", e.message);
    //         res.status(400).json({
    //             success: false,
    //             errorMessage: e.name,
    //         })
    //         return;
    //     }
    // });
};