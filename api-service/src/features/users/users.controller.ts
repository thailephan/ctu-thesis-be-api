import bcrypt from "bcryptjs";
import { Express } from "express";
import axios from "axios";
const service = require("./users.service");
const config = require("../../config");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");
const middleware = require("../../middleware");
const redis = require("../../data.storage");

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
    app.get("/users/getUserById/:id", middleware.verifyToken, async (req, res) => {
        const { id } = req.params;
        try {
            const result = await service.getUserInformation(id);
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

            // TODO: Save to redis with timeout
            const code = Helpers.randomString();
            redis.set(code, {
               ...user,
                email,
                iat: (new Date()).getTime(),
                exp: 3600 * 1000,
            });

            const requestMailServiceResult = await axios.post(config.service.mailServiceUrl + "/sendResetPasswordEmail", {
                ...user,
                to: email,
                resetUrl: `http://localhost:4003/reset-password?code=${code}`,
            });
            if (requestMailServiceResult.data.success) {
                return res.status(200).json({
                    success: true,
                    statusCode: 200,
                    data: "Gửi mail đặt lại mật khẩu thành công",
                    message: null,
                });
            } else {
                return res.status(200).json(...requestMailServiceResult.data);
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
    app.post("/users/confirmResetPassword", async (req, res) => {
        const { password, confirmPassword, code } = req.body;

        const user = redis.get(code);
        if (Helpers.isNullOrEmpty(user)) {
            return res.status(200).json({
                success: false,
                statusCode: 400,
                data: null,
                message: "Không tìm thấy user cần cập nhật mật khẩu với code: " + code,
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
            const result = await service.changePassword({ hash: passwordHash, email: user.email });
            if (result) {
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
        // TODO: Post
    });
};