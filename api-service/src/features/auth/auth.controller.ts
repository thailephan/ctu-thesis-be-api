import {ITokenPayload} from "../../common/interface";

export {}
import { Express } from "express";
import bcrypt from "bcryptjs";
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");
const middleware = require("../../middleware");
const service = require('./auth.service');
const constants = require("../../common/constants");

const GOOGLE_REGISTER_TYPE_ID = 2;
module.exports = (app: Express) => {
    app.post("/auth/verifyToken", middleware.verifyToken, async (req, res) => {
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
            return res.status(200).json({
                success: false,
                data: null,
                message: "Không tìm thấy email",
            });
        }
        const result = await service.getAccountByEmail(email);
        if (!result) {
            return res.status(200).json({
                success: true,
                data: {
                    isEmailRegistered: false,
                },
                message: null,
            });
        }
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
            return res.status(200).json({
                success: false,
                message: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            return res.status(200).json({
                success: false,
                data: null,
                message: "Email chưa đùng định dạng",
                enMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            return res.status(200).json({
                success: false,
                data: null,
                message: "Mật khẩu không được dể trống",
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

            // return success with login token
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } catch (e) {
            let message = e.message;

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
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Email hoặc mật khẩu không được rỗng",
            });
        }

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
            return res.status(200).json({
                success: false,
                data: null,
                statusCode: 400,
                message: "Tài khoản không tồn tại",
            });
        }

        // check password
        const match = await bcrypt.compare(password, account.hash);
        debug.api({account, match});
        if (!match) {
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
        delete account.tempHash;

        const payload: ITokenPayload = account;

        return res.status(200).json({
            success: true,
            message: null,
            statusCode: 200,
            data: {
                accessToken: Helpers.generateToken(payload),
            },
        })
    });

    // Login with google
    app.post("/auth/login/google", async (req, res) => {
        const { email } = req.body;

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
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
        delete account.tempHash;

        const payload: ITokenPayload = account;

        return res.status(200).json({
            success: true,
            message: null,
            statusCode: 200,
            data: {
                accessToken: Helpers.generateToken(payload),
            },
        });
    });
    app.post("/auth/logout", middleware.verifyToken, (req, res) => {
        // remove token from redis
        // @ts-ignore
        if (req.user) {
            return res.status(200).json({
                success: true,
                data: null,
                message: null,
                statusCode: 200,
            });
        } else {
            return res.status(200).json({
                success: true,
                statusCode: 400,
                data: null,
                message: "Đăng xuất không thành công",
            });
        }
    })
}