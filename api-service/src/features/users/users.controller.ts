import { Express } from "express";
const service = require("./users.service");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");

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
    app.post("/users/update", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const user = req.user;
        const { fullName = user.fullName, birthday = user.birthday, gender, phoneNumber = user.phoneNumber, avatarUrl = user.avatarUrl } = req.body;

        const dbGender = Helpers.isNullOrEmpty(gender) ? user.gender : gender;
        console.log(dbGender);
        try {
            const updatedUser = await service.updateUser({id: user.id, fullName, birthday,
                gender: dbGender, phoneNumber, avatarUrl});
            const payload = {...updatedUser};

            delete payload.hash;
            delete payload.tempHash;

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    updatedUser: payload,
                    accessToken: Helpers.generateToken(payload),
                },
                message: null,
            });
        } catch(e) {
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: e.message,
            });
        }
    });
    app.post("/users/lock-account", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const user = req.user;

        try {
            const lockedUser = await service.lockUser({ userId: user.id });

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: lockedUser,
                message: null,
            });
        }  catch (e) {
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: e.message,
            });
        }
    });
    // TODO: Unlock user account
};