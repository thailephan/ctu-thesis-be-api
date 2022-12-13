import {MailTemplate} from "../../common/interface";
import {Express} from "express";
import bcrypt from "bcryptjs";
import {LogType} from "../../common/logging";

export {}
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");
const middleware = require("../../middleware");
const service = require('./auth.service');
const constants = require("../../common/constants");
const { redis } = require("../../common/redis");
const producer = require("../../common/kafka").producer;
const config = require("../../config");

module.exports = (app: Express) => {
    app.post("/auth/verifyToken", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        debug.api("POST /auth/verifyToken", `Verified User: ${req.user}`);
        await producer.send(Helpers.getKafkaLog(req, {
            messages: [{
                value: {
                    type: LogType.Ok,
                    message: "Verify success",
                    // @ts-ignore
                    data: { id: req.user.id },
                    executedFunction: "POST /auth/verifyToken",
                }
            },]
        }));
        return res.status(200).json({
            status: 200,
            message: null,
            data: null,
            success: true,
        })
    });
    app.post("/auth/check_mail_registered", async (req, res) => {
        const { email } = req.body;
        if (Helpers.isNullOrEmpty(email)) {
            debug.api("POST /auth/check_mail_registered | isNullOrEmpty(email)", `${email} not found`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Email not found",
                        data: { email },
                        executedFunction: "POST /auth/check_mail_registered | isNullOrEmpty(email)",
                    }
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Không tìm thấy email",
            });
        }

        const result = await service.getAccountByEmail(email);
        if (!result) {
            debug.api("POST /auth/check_mail_registered", `${email} not registered`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        request: {
                            query: req.query, params: req.params, body: req.body,
                        },
                        data: { email },
                        executedFunction: "POST /auth/check_mail_registered | isNullOrEmpty(service.getAccountByEmail)",
                    }
                },]
            }));
            return res.status(200).json({
                success: true,
                data: {
                    isEmailRegistered: false,
                },
                message: null,
            });
        }

        debug.api("POST /auth/check_mail_registered", `${email} registered`);
        await producer.send(Helpers.getKafkaLog(req, {
            messages: [{
                value: {
                    type: LogType.Ok,
                    request: {
                        query: req.query, params: req.params, body: req.body,
                    },
                    data: { email, isEmailRegistered: true },
                    executedFunction: "POST /auth/check_mail_registered",
                }
            },]
        }));
        return res.status(200).json({
            success: true,
            data: {
                isEmailRegistered: true,
            },
            message: null,
        });
    });
    // TODO: One email can register multiple time (error)
    app.post("/auth/register", async (req, res) => {
        const {fullName, password, email} = req.body;
        if (Helpers.isNullOrEmpty(email)) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Email not found",
                        data: { email },
                        executedFunction: "POST /auth/register",
                    },
                },]
            }));
            debug.api("POST /auth/register | isNullOrEmpty(email)", `${email} not found`, "ERROR");
            return res.status(200).json({
                success: false,
                message: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            debug.api("POST /auth/register | isEmail(email)", `${email} has wrong format`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Wrong email format",
                        data: { email },
                        executedFunction: "POST /auth/register | isEmail(email)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Email chưa đùng định dạng",
                enMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            debug.api("POST /auth/register | isNullOrEmpty(password)", `${password} is empty`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Empty password",
                        executedFunction: "POST /auth/register | isNullOrEmpty(password)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Mật khẩu không được dể trống",
            });
        }
        const account = await service.getAccountByEmail(email);
        if (!Helpers.isNullOrEmpty(account)) {
            debug.api("POST /auth/register | isNullOrEmpty(getAccountByEmail(email))", `${email} has registered`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Email registered",
                        executedFunction: "POST /auth/register | isNullOrEmpty(account)",
                    },
                },]
            }));
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: "Email đã được đăng ký.",
            });
        }

        const hash = await Helpers.hash(password);
        const default_account: any = {
            fullName,
            email,
            hash,
            registerTypeId: 1,
        };
        try {
            // create account with username and password
            await service.createAccount(default_account);

            debug.api("POST /auth/register | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} has created`);
            // return success with login token
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Ok,
                        message: "Account created",
                        executedFunction: "POST /auth/register | isNullOrEmpty(getAccountByEmail(email))",
                    },
                },]
            }));
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } catch (e) {
            let message = e.message;

            debug.api("POST /auth/register | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} failed to create`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Error occured. Failed to create account. Log: " + e.message,
                        executedFunction: "POST /auth/register | isNullOrEmpty(getAccountByEmail(email))",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: message,
            });
        }
    });
    // Note : unused any more
    app.post("/auth/reActivateRegister", async (req, res) => {
        const { fullName, password, email } = req.body;

        if (Helpers.isNullOrEmpty(email)) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Empty email",
                        data: {email},
                        executedFunction: "POST /auth/register | isNullOrEmpty(email)",
                    },
                },]
            }));
            debug.api("POST auth/reActivateRegister | isNullOrEmpty(email)", `${email} not found`, "ERROR");
            return res.status(200).json({
                success: false,
                message: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            debug.api("POST auth/reActivateRegister | isEmail(email)", `${email} has wrong format`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Wrong email format",
                        data: {email},
                        executedFunction: "POST /auth/registerMustActive | isEmail(email)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Email chưa đùng định dạng",
                enMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            debug.api("POST auth/reActivateRegister | isNullOrEmpty(password)", `${password} is empty`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Wrong password",
                        executedFunction: "POST /auth/registerMustActive | isNullOrEmpty(password)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Mật khẩu không được dể trống",
            });
        }
        const account = await service.getAccountByEmail(email);

        if (Helpers.isNullOrEmpty(account)) {
            debug.api("POST auth/reActivateRegister | isNullOrEmpty(getAccountByEmail(email))", `${email} has not registered`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Account is not registered and but call activated",
                        executedFunction: "POST /auth/reActivateRegister | !isNullOrEmpty(account)",
                    },
                },]
            }));
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: "Email không được đăng ký.",
            });
        }

        if (account.status === 1) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType. Ok,
                        message: "Tài khoản không cần được kích hoạt, vui lòng không kích hoạt lại",
                        executedFunction: "POST /auth/reActivateRegister | !isNullOrEmpty(account)",
                    },
                },]
            }));
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: "Tài khoản không cần được kích hoạt, vui lòng không kích hoạt lại",
            });
        }
        if (account.status === -1) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType. Ok,
                        message: "Tài khoản đã bị xóa. Vui lòng liên lạc với chúng tôi để biết thêm chi tiết",
                        executedFunction: "POST /auth/reActivateRegister | !isNullOrEmpty(account)",
                    },
                },]
            }));
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: "Tài khoản đã bị xóa. Vui lòng liên lạc với chúng tôi để biết thêm chi tiết",
            });
        }
        const hash = await Helpers.hash(password);
        const default_account: any = {
            fullName,
            email,
            hash,
            registerTypeId: 1,
        };
        try {
            // create account with username and password
            await service.updateReActivateAccount(default_account);
            await producer.send(Helpers.getKafkaEventToMail(req, {
                messages: [{
                    value: {
                        type: MailTemplate.ActivateAccount,
                        data: {
                            to: email,
                            fullName,
                        }
                    }
                },]
            }));
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Ok,
                        message: "Success sending activate email for account",
                        executedFunction: "POST auth/reActivateRegister | isNullOrEmpty(getAccountByEmail(email))",
                    },
                },]
            }));
            debug.api("POST auth/reActivateRegister | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} has created`);
            // return success with login token
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } catch (e) {
            let message = e.message;

            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Error occurred. Error: " + e.message,
                        executedFunction: "POST auth/reActivateRegister | isNullOrEmpty(getAccountByEmail(email))",
                    },
                },]
            }));
            debug.api("POST auth/reActivateRegister | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} failed to create`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: message,
            });
        }
    });
    app.post("/auth/registerMustActivate", async (req, res) => {
        const {fullName, password, email} = req.body;
        if (Helpers.isNullOrEmpty(email)) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Empty email",
                        data: {email},
                        executedFunction: "POST /auth/register | isNullOrEmpty(email)",
                    },
                },]
            }));
            debug.api("POST auth/registerMustActive | isNullOrEmpty(email)", `${email} not found`, "ERROR");
            return res.status(200).json({
                success: false,
                message: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            debug.api("POST auth/registerMustActivate | isEmail(email)", `${email} has wrong format`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Wrong email format",
                        data: {email},
                        executedFunction: "POST /auth/registerMustActive | isEmail(email)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Email chưa đùng định dạng",
                enMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(password)", `${password} is empty`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Wrong password",
                        executedFunction: "POST /auth/registerMustActive | isNullOrEmpty(password)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                message: "Mật khẩu không được dể trống",
            });
        }
        const account = await service.getAccountByEmail(email);

        if (!Helpers.isNullOrEmpty(account)) {
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(getAccountByEmail(email))", `${email} has registered`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Account has registered and activated",
                        executedFunction: "POST /auth/registerMustActive | !isNullOrEmpty(account)",
                    },
                },]
            }));
            return res.status(200).json({
                statusCode: 400,
                success: false,
                data: null,
                message: "Email đã được đăng ký.",
            });
        }

        const hash = await Helpers.hash(password);
        const default_account: any = {
            fullName,
            email,
            hash,
            registerTypeId: 1,
        };
        try {
            // create account with username and password
            await producer.send(Helpers.getKafkaEventToMail(req, {
                messages: [{
                    value: {
                        type: MailTemplate.ActivateAccount,
                        data: {
                            to: email,
                            fullName,
                            account: default_account
                        }
                    }
                },]
            }));
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Ok,
                        message: "Success sending activate email for account",
                        executedFunction: "POST auth/registerMustActivate | isNullOrEmpty(getAccountByEmail(email))",
                    },
                },]
            }));
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} has created`);
            // return success with login token
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } catch (e) {
            let message = e.message;

            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Error occurred. Error: " + e.message,
                        executedFunction: "POST auth/registerMustActivate | isNullOrEmpty(getAccountByEmail(email))",
                    },
                },]
            }));
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} failed to create`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: message,
            });
        }
    });

    // Username / password login
    app.post("/auth/login", async (req, res) => {
        const {email, password} = req.body;
        if ([email, password].some(v => Helpers.isNullOrEmpty(v))) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Email or password is empty",
                        data: {email},
                        executedFunction: "POST auth/login | isNullOrEmpty(email, password)",
                    },
                },]
            }));
            debug.api("POST /auth/login", `Email: ${email} or password: ${password} is empty`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Email hoặc mật khẩu không được rỗng",
            });
        }

        if (!Helpers.isNullOrEmpty(email) && await redis.get(`users/online/${email}`)) {
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                code: "001",
                message: "Tài khoản đang được đăng nhập ở nơi khác. Vui lòng đăng xuất và đăng nhập lại trên thiết bị này",
            });
        }

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
            debug.api("POST /auth/login | getAccountByEmail", `Not found account with email: ${email} or password: ${password}`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Not existed account",
                        data: {email},
                        executedFunction: "POST auth/login | getAccountByEmail(email)",
                    },
                },]
            }));
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Tài khoản không tồn tại",
            });
        }

        // check password
        const match = await bcrypt.compare(password, account.hash);
        if (!match) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Wrong enter password",
                        executedFunction: "POST auth/login | bcrypt.compare(password)",
                    },
                },]
            }));
            debug.api("POST /auth/login | bcrypt.compare", `account.hash is not match with password: ${password}`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Mật khẩu không chính xác",
            });
        }

        // Assign new fields
        account.registerType = constants.AccountRegisterTypes.get(account.registerTypeId) || "";

        // Remove important fields
        delete account.hash;
        delete account.registerTypeId;

        // const platform = req.headers["user-agent"].match(/\(([\d\w\ \.]*)(?=;)/i)?.[1] || null;
        // const subscribeGroupId = `user/${account.id}/${Helpers.randomString()}`;
        // const addUserLoginDevice = await service.addUserDevice({ id: account.id,
        //     userAgent: req.headers["user-agent"],
        //     platform,
        //     subscribeGroupId,
        // });
        // account.deviceId = addUserLoginDevice?.id || "Empty";
        // account.subscribeGroupId = subscribeGroupId;

        const accessToken = Helpers.generateToken(account);

        await producer.send(Helpers.getKafkaLog(req, {
            messages: [{
                value: {
                    type: LogType.Ok,
                    message: "Login success",
                    executedFunction: "POST auth/login",
                },
            },]
        }));

        await redis.set(`auth/tokens/${accessToken}`, JSON.stringify(account));
        await redis.set(`users/online/${account.email}`, accessToken);

        debug.api("POST /auth/login", `Login success with token: ${accessToken}`, "INFO");

        return res.status(200).json({
            success: true,
            message: null,
            statusCode: 200,
            data: {
                accessToken,
            },
        })
    });

    // Login with google
    app.post("/auth/login/google", async (req, res) => {
        const { email } = req.body;

        if (!Helpers.isNullOrEmpty(email) && await redis.get(`users/online/${email}`)) {
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                code: "001",
                message: "Tài khoản đang được đăng nhâp ở nơi khác. Vui lòng đăng xuất và đăng nhập lại trên thiết bị này",
            });
        }

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Account not existed",
                        executedFunction: "POST auth/login/google",
                    },
                },]
            }));
            debug.api("POST /auth/login/google", `Not found account with mail: ${email}`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Tài khoản không tồn tại",
            });
        }

        // Assign new fields
        account.registerType = constants.AccountRegisterTypes.get(account.registerTypeId) || "";

        // Remove important fields
        delete account.hash;
        delete account.registerTypeId;

        // const platform = req.headers["user-agent"].match(/\(([\d\w\ \.]*)(?=;)/i)?.[1] || null;
        // const subscribeGroupId = `user/${account.id}/${Helpers.randomString()}`;
        // const addUserLoginDevice = await service.addUserDevice({ id: account.id,
        //     userAgent: req.headers["user-agent"],
        //     platform,
        //     subscribeGroupId,
        // });
        //
        // account.deviceId = addUserLoginDevice?.id || "Empty";
        // account.subscribeGroupId = subscribeGroupId;
        const accessToken = Helpers.generateToken(account);

        debug.api("POST /auth/login", `Login success with token: ${accessToken}`, "INFO");
        await producer.send(Helpers.getKafkaLog(req, {
            messages: [{
                value: {
                    type: LogType.Ok,
                    message: "",
                    executedFunction: "POST auth/login/google",
                },
            },]
        }));
        await redis.set(`auth/tokens/${accessToken}`, JSON.stringify(account));
        await redis.set(`users/online/${account.email}`, accessToken);

        return res.status(200).json({
            success: true,
            message: null,
            statusCode: 200,
            data: {
                accessToken,
            },
        })
    });
    app.post("/auth/logout", middleware.verifyToken, async (req, res) => {
        // remove token from redis
        // @ts-ignore
        if (req.user) {
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Ok,
                        message: "Logout success",
                        executedFunction: "POST auth/logout",
                    },
                },]
            }));
            // @ts-ignore
            const accessToken = await redis.get(`users/online/${req.user.email}`);
            // @ts-ignore
            console.log(req.user.email, accessToken);
            await redis.del(`auth/tokens/${accessToken}`);
            // @ts-ignore
            await redis.del(`users/online/${req.user.email}`);
            // @ts-ignore
            debug.api("POST /auth/logout", `Logout success with token: ${JSON.stringify(req.user)}`, "INFO");
            // @ts-ignore
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } else {
            debug.api("POST /auth/logout", `Logout failed`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Error when logout",
                        executedFunction: "POST auth/logout",
                    },
                },]
            }));
            return res.status(200).json({
                success: true,
                statusCode: 400,
                data: null,
                message: "Đăng xuất không thành công",
            });
        }
    })
}