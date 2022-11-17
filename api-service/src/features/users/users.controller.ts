import bcrypt from "bcryptjs";
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
        const { fullName, birthday, gender, phoneNumber } = req.body;

        const dbGender = Helpers.isNullOrEmpty(gender) ? user.gender : gender;
        try {
            const updatedUser = await service.updateUser({id: user.id, fullName, birthday,
                gender: dbGender, phoneNumber });

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: {
                    updatedUser: updatedUser,
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
    app.post("/users/updateAvatar", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const user = req.user;
        const { avatarUrl } = req.body;

        try {
            const updatedUser = await service.updateUserAvatar({ id: user.id, avatarUrl });

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: null,
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
    app.post("/users/lockAccount", middleware.verifyToken, async (req, res) => {
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

    app.get("/users/userInformation", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        const { id = "" } =  req.user;
        if (Helpers.isNullOrEmpty(id)) {
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: `Id của người dùng không hợp lệ: (id = ${id})`,
            }) ;
        }

        try {
            const userInformation = await service.getUserInformation(id);

            if (Helpers.isNullOrEmpty(userInformation)) {
                return res.status(200).json({
                    statusCode: 400,
                    success: false,
                    data: null,
                    isUserExisted: false,
                    message: "Người dùng không tồn tại",
                })
            }
            delete userInformation.hash;
            delete userInformation.tempHash;
            delete userInformation.createdAt;
            delete userInformation.updatedAt;
            delete userInformation.createdBy;
            delete userInformation.updatedBy;
            delete userInformation.status;

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: userInformation,
                message: null,
            })
        } catch (e) {
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: e.message,
            })
        }
    });
    app.post("/users/changePassword", middleware.verifyToken, async (req, res) => {
        const { oldPassword, password, confirmPassword } = req.body;
        if (Helpers.isNullOrEmpty(oldPassword)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Mật khẩu cũ không được rỗng",
            })
        }
        if (Helpers.isNullOrEmpty(password)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Mật khẩu mới không được rỗng",
            })
        }
        if (Helpers.isNullOrEmpty(confirmPassword)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Xác nhận mật khẩu mới không được rỗng",
            });
        }
        if (confirmPassword !== password) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Xác nhận mật khẩu mới và mật khẩu không trùng khớp",
            });
        }

        try {
            // @ts-ignore
            const id = req.user.id;
            const account = await service.getAccountById(id);
            if (Helpers.isNullOrEmpty(account)) {
                return res.status(200).json({
                    success: false,
                    data: null,
                    statusCode: 400,
                    message: "Tài khoản không tồn tại",
                });
            }

            // check password
            const match = await bcrypt.compare(oldPassword, account.hash);

            if (!match) {
                return res.status(200).json({
                    success: false,
                    data: null,
                    statusCode: 400,
                    message: "Mật khẩu cũ không đúng",
                });
            }

            const hash = await Helpers.hash(password);

            const user = await service.updateUserPassword(id, hash);
            if (Helpers.isNullOrEmpty(user)) {
                return res.status(200).json({
                    success: false,
                    statusCode: 400,
                    data: user,
                    message: null,
                })
            }

            return res.status(200).json({
                success: true,
                statusCode: 200,
                data: null,
                message: null,
            })
        } catch (e) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: e.message,
            })
        }
    });
};