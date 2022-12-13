import bcrypt from "bcryptjs";
import { Express } from "express";
import {MailTemplate} from "../../common/interface";
const service = require("./users.service");
const config = require("../../config");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");
const { redis } = require("../../common/redis");
const { producer } = require("../../common/kafka");

module.exports = (app: Express) => {
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
        console.log(req.body);
        try {
            const updatedUser = await service.updateUser({id: user.id, fullName, birthday,
                gender: dbGender, phoneNumber });
            debug.api("POST /users/update", `User id: ${user.id}. Data: ${JSON.stringify(updatedUser)}`)
            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: updatedUser,
                message: null,
            });
        } catch(e) {
            debug.api("POST /users/update", `User id: ${user.id}. Error: ${JSON.stringify(e.message)}`, "ERROR")
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
    app.get("/users/getUserById/:id", middleware.verifyToken, async (req, res) => {
        const { id } = req.params;
        try {
            const result = await service.getUserInformation(id);
            if (result?.email && await redis.get(`/users/online/${result.email}`)) {
               result.isOnline = true;
            } else {
               result.isOnline = true;
            }

            return res.status(200).json({
                statusCode: 200,
                success: true,
                data: result,
                message: null,
            });
        } catch (e) {
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
                    message: "Mật khẩu cũ không chính xác",
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
    app.get("/users/search", middleware.verifyToken, async (req, res) => {
        const { searchText = "" } = req.query;

        // TODO: Handle empty error
        // @ts-ignore
        const result = await service.searchUser({searchText: searchText.trim(), userId: req.user.id});

        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: result
        });
    });
    app.post("/users/resetPassword", async (req, res) => {
        const email = req.body.email;

        if (Helpers.isNullOrEmpty(email) && !Helpers.isEmail(email)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Email không hợp lệ",
            });
        }

        try {
            const user = await service.getUserByEmail({ email });

            if (!user) {
                return res.status(200).json({
                    success: false,
                    statusCode: 200,
                    data: null,
                    message: "Không tìm thấy email",
                });
            }

            await producer.send(Helpers.getKafkaEventToMail(req, {
                key: MailTemplate.ResetPassword,
                messages: [{
                    value: {
                        type: MailTemplate.ResetPassword,
                        data: {
                            to: email,
                            fullName: user.fullName,
                        }
                    }
                },]
            }));

            return res.status(200).json({
                success: true,
                statusCode: 200,
                data: "Gửi mail đặt lại mật khẩu thành công",
                message: null,
            });
        } catch (e) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: e.message,
            });
        }
    });
    app.post("/users/confirmResetPassword", async (req, res) => {
        const { password, confirmPassword, code } = req.body;

        const email = await redis.get(code);

        if (Helpers.isNullOrEmpty(email)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Code không hợp lệ. Code: " + code,
            });
        }

        if (Helpers.isNullOrEmpty(password)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Mật khẩu rỗng",
            });
        }
        if (!Helpers.isNullOrEmpty(confirmPassword) && confirmPassword.localeCompare(password) !== 0) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Mật khẩu và xác nhận mật khẩu không khớp",
            });
        }

        try {
            const passwordHash = await Helpers.hash(password);
            const result = await service.changePassword({ hash: passwordHash, email: email });
            if (result) {
                await redis.del(code);
                return res.status(200).json({
                    success: true,
                    statusCode: 200,
                    data: result,
                    message: null,
                });
            } else {
                return res.status(200).json({
                    success: false,
                    statusCode: 500,
                    data: null,
                    message: "Đã có lỗi xảy ra. Không thể cập nhật mật khẩu mới",
                });
            }
        } catch (e) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: e.message,
            });
        }
    });
    app.post("/users/activateAccount", async (req, res) => {
        const  { code = "" } = req.body;

        if (!code) {
            return res.status(200).json({
                success: false,
                message: "Không có code",
                data: null,
            });
        }
        try {
            const account = await redis.get(code);
            const json = JSON.parse(account);

            if (!json) {
                return res.status(200).json({
                    success: false,
                    message: "Người dùng không tồn tại",
                    data: null,
                });
            } else {
                await service.createAccount(json);
                await redis.del(code);
                return res.status(200).json({
                    success: true,
                    message: null,
                    data: null,
                });
            }
        } catch (e) {
            return res.status(200).json({
                success: false,
                message: e.message,
                data: null,
            });
        }
    });
};