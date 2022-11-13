import { Express } from "express";
const service = require("./users.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const { filterGetList } = require("../../middleware");

module.exports = (app: Express, firebase: any) => {
    app.get("/admin/users/getAll", async (req, res) => {
        try {
            const users = await service.getAll();
            return res.status(200).json({
                success: true,
                data: users,
                message: null,
            });
        } catch (e) {
            return res.status(200).json({
                success: false,
                data: null,
                message: e.message,
            });
        }
    });
};