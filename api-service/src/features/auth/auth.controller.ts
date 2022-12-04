import {MailTemplate} from "../../common/interface";

export {}
import { Express } from "express";
import bcrypt from "bcryptjs";
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");
const middleware = require("../../middleware");
const service = require('./auth.service');
const constants = require("../../common/constants");
const redis = require("../../common/redis").redisClient;
const producer = require("../../common/kafka").producer;
const config = require("../../config");

module.exports = (app: Express) => {
    app.post("/auth/verifyToken", middleware.verifyToken, async (req, res) => {
        // @ts-ignore
        debug.api("POST /auth/verifyToken", `Verified User: ${req.user}`);

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
            return res.status(200).json({
                success: false,
                data: null,
                message: "Không tìm thấy email",
            });
        }

        const result = await service.getAccountByEmail(email);
        if (!result) {
            debug.api("POST /auth/check_mail_registered", `${email} not registered`, "ERROR");
            return res.status(200).json({
                success: true,
                data: {
                    isEmailRegistered: false,
                },
                message: null,
            });
        }

        debug.api("POST /auth/check_mail_registered", `${email} registered`);
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
            debug.api("POST /auth/register | isNullOrEmpty(email)", `${email} not found`, "ERROR");
            return res.status(200).json({
                success: false,
                message: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            debug.api("POST /auth/register | isEmail(email)", `${email} has wrong format`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                message: "Email chưa đùng định dạng",
                enMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            debug.api("POST /auth/register | isNullOrEmpty(password)", `${password} is empty`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                message: "Mật khẩu không được dể trống",
            });
        }
        const account = await service.getAccountByEmail(email);
        if (!Helpers.isNullOrEmpty(account)) {
            debug.api("POST /auth/register | isNullOrEmpty(getAccountByEmail(email))", `${email} has registered`, "ERROR");
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
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } catch (e) {
            let message = e.message;

            debug.api("POST /auth/register | isNullOrEmpty(getAccountByEmail(email))", `${JSON.stringify(default_account)} failed to create`, "ERROR");
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
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(email)", `${email} not found`, "ERROR");
            return res.status(200).json({
                success: false,
                message: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            debug.api("POST auth/registerMustActivate | isEmail(email)", `${email} has wrong format`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                message: "Email chưa đùng định dạng",
                enMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(password)", `${password} is empty`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                message: "Mật khẩu không được dể trống",
            });
        }
        const account = await service.getAccountByEmail(email);

        await producer.send({
            topic: config.kafkaSettings.mailTopic,
            key: MailTemplate.ResetPassword,
            messages: [{
                value: JSON.stringify({
                    type: MailTemplate.ResetPassword,
                    data: {
                        to: email,
                        metadata: {
                            flowId: req.flowId,
                        }
                    }
                })
            },]
        });

        if (!Helpers.isNullOrEmpty(account)) {
            debug.api("POST auth/registerMustActivate | isNullOrEmpty(getAccountByEmail(email))", `${email} has registered`, "ERROR");
            if (account.status === 0) {
                return res.status(200).json({
                    statusCode: 400,
                    success: false,
                    data: null,
                    message: "Email đã được đăng ký. Vui lòng kiểm tra mail để kích hoạt tài khoản",
                });
            }
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
            await service.createAccountMustActivate(default_account);
            // TODO: Send Email to validate account
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
            debug.api("POST /auth/login", `Email: ${email} or password: ${password} is empty`, "ERROR");
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Email hoặc mật khẩu không được rỗng",
            });
        }

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
            debug.api("POST /auth/login | getAccountByEmail", `Not found account with email: ${email} or password: ${password}`, "ERROR");
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

        const platform = req.headers["user-agent"].match(/\(([\d\w\ \.]*)(?=;)/i)?.[1] || null;
        const subscribeGroupId = `user/${account.id}/${Helpers.randomString()}`;
        const addUserLoginDevice = await service.addUserDevice({ id: account.id,
            userAgent: req.headers["user-agent"],
            platform,
            subscribeGroupId,
        });
        account.deviceId = addUserLoginDevice?.id || "Empty";
        account.subscribeGroupId = subscribeGroupId;

        const accessToken = Helpers.generateToken(account);

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

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
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

        const platform = req.headers["user-agent"].match(/\(([\d\w\ \.]*)(?=;)/i)?.[1] || null;
        const subscribeGroupId = `user/${account.id}/${Helpers.randomString()}`;
        const addUserLoginDevice = await service.addUserDevice({ id: account.id,
            userAgent: req.headers["user-agent"],
            platform,
            subscribeGroupId,
        });

        account.deviceId = addUserLoginDevice?.id || "Empty";
        account.subscribeGroupId = subscribeGroupId;
        const accessToken = Helpers.generateToken(account);

        await redis.sAdd(`users/device/${account.id}`, account.deviceId);

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
    app.post("/auth/logout", middleware.verifyToken, (req, res) => {
        // remove token from redis
        // @ts-ignore
        if (req.user) {
            // @ts-ignore
            debug.api("POST /auth/logout", `Logout success with token: ${JSON.stringify(req.user)}`, "INFO");
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } else {
            debug.api("POST /auth/logout", `Logout failed`, "ERROR");
            return res.status(200).json({
                success: true,
                statusCode: 400,
                data: null,
                message: "Đăng xuất không thành công",
            });
        }
    })
}