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
    app.post("/auth/checkMailRegisted", async (req, res) => {
        const { email } = req.body;
        if (Helpers.isNullOrEmpty(email)) {
            return res.status(200).json({
                success: false,
                data: null,
                errorMessage: "Không tìm thấy email",
            });
        }
        const result = await service.getAccountByEmail(email);
        if (!result) {
            return res.status(200).json({
                success: false,
                data: null,
                errorMessage: null,
            });
        }
        return res.status(200).json({
            success: true,
            data: null,
            errorMessage: null,
        })
    });
    // TODO: One email can register multiple time (error)
    app.post("/auth/register", async (req, res) => {
        const {fullName, password, email} = req.body;
        if (Helpers.isNullOrEmpty(email)) {
            return res.status(200).json({
                success: false,
                errorMessage: "Không tìm thấy email",
                data: null,
            });
        }
        if (!Helpers.isEmail(email)) {
            return res.status(200).json({
                success: false,
                data: null,
                errorMessage: "Email chưa đùng định dạng",
                enErrorMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
            });
        }
        if (Helpers.isNullOrEmpty(password)) {
            return res.status(200).json({
                success: false,
                data: null,
                errorMessage: "Mật khẩu không được dể trống",
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
                errorMessage: null,
            });
        } catch (e) {
            let message = e.message;

            return res.status(200).json({
                success: false,
                data: null,
                errorMessage: message,
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
                errorMessage: "Email hoặc mật khẩu không được rỗng",
            });
        }

        const account = await service.getAccountByEmail(email);
        if (Helpers.isNullOrEmpty(account)) {
            return res.status(200).json({
                success: false,
                data: null,
                errorMessaage: "Tài khoản không tồn tại",
            });
        }

        // check password
        const match = await bcrypt.compare(password, account.hash);
        debug.api({account, match});
        if (!match) {
            return res.status(200).json({
                success: false,
                data: null,
                errorMessage: "Mật khẩu không chính xác",
            });
        }

        // Assign new fields
        account.registerType = constants.AccountRegisterType.get(account.registerTypeId) || "";

        // Remove important fields
        delete account.hash;
        delete account.tempHash;

        const payload: ITokenPayload = account;

        return res.status(200).json({
            success: true,
            errorMessage: null,
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
                errorMessaage: "Tài khoản không tồn tại",
            });
        }

        // Assign new fields
        account.registerType = constants.AccountRegisterType.get(account.registerTypeId) || "";

        // Remove important fields
        delete account.hash;
        delete account.tempHash;

        const payload: ITokenPayload = account;

        return res.status(200).json({
            success: true,
            errorMessage: null,
            data: {
                accessToken: Helpers.generateToken(payload),
            },
        });
    })
}

// TODO: handle verify with email
// module.exports = (app: Express) => {
//     app.post("/auth/login", async (req, res) => {
//         const {email, password} = req.body;
//         if ([email, password].some(v => Helpers.isNullOrEmpty(v))) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 errorMessage: "Email hoặc mật khẩu không được rỗng",
//             });
//         }
//         const account = await service.getAccountByEmail(email);
//         if (Helpers.isNullOrEmpty(account)) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 errorMessaage: "Tài khoản không tồn tại",
//             });
//         }
//         // check password
//         const match = await bcrypt.compare(password, account.hash);
//         debug.api({account, match});
//         if (!match) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 errorMessage: "Mật khẩu không chính xác",
//             });
//         }
//         const payload: ITokenPayload = {
//             email: account.email,
//             classId: account.classId,
//         };
//         return res.status(200).json({
//             success: true,
//             statusCode: 200,
//             data: {
//                 accessToken: Helpers.generateToken(payload),
//             },
//         })
//     })
//     app.post("/auth/forgot-password", async (req, res) => {
//         // User send user's email or username
//         // Send s1: new password (easier) /s2: reset code user through email (harder)
//         // s1: User login with new password.
//         // s1:o1: User will meet the change password screen (harder)
//         // s1:o2: User will go to change password screen to update old password (easier)
//         // s2: App will send user to confirm screen, user get reset code in email and paste in app
//         // s2:o1: App will redirect to change password screen
//         // s2:o1: App will log user in, user should go to forgot password page to update and verify code will expired
//         // Send reset password user through email
//     });
//     app.post("/auth/change-password", async (req, res) => {
//     });
//
// //  GOOGLE AUTH
//     app.post("/auth/register/google", async (req, res) => {
//         const {email} = req.body;
//         if (Helpers.isNullOrEmpty(email)) {
//             return res.status(400).json({
//                 success: false,
//                 errorMessage: "Không tìm thấy email",
//                 statusCode: 400,
//             });
//         }
//         if (!Helpers.isEmail(email)) {
//             return res.status(400).json({
//                 success: false,
//                 errorMessage: "Email chưa đùng định dạng",
//                 enErrorMessage: `wrong email format. regexp: ${String(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)}`,
//                 statusCode: 400,
//             });
//         }
//
//         const default_account: any = {
//             email,
//             register_type: 2,
//         };
//
//         try {
//             // create account with username and password
//             await service.createAccount(default_account);
//
//             // return success with login token
//             return res.status(200).json({
//                 success: true,
//                 statusCode: 200,
//             })
//         } catch (e) {
//             let message = e.message;
//             if (message === "duplicate key value violates unique constraint \"useraccounts_email_key\"") {
//                 message = "Tài khoản đã tồn tại";
//             }
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 200,
//                 errorMessage: message,
//             });
//         }
//     });
//
//     app.post("/auth/login/google", async (req, res) => {
//         const {email} = req.body;
//         if (Helpers.isNullOrEmpty(email)) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 errorMessage: "Không tìm thấy email",
//             });
//         }
//         const account = await service.getAccountByEmail(email);
//         if (Helpers.isNullOrEmpty(account)) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 errorMessage: "Tài khoản không tồn tại",
//             });
//         }
//         if (account.registerTypeId !== GOOGLE_REGISTER_TYPE_ID) {
//             return res.status(400).json({
//                 success: false,
//                 statusCode: 400,
//                 errorMessage: "Tài khoản chỉ được đăng nhập bằng email/password",
//             });
//         }
//         const payload: ITokenPayload = {
//             email: account.email,
//             classId: account.classId,
//         };
//         return res.status(200).json({
//             success: true,
//             statusCode: 200,
//             data: {
//                 accessToken: Helpers.generateToken(payload),
//             },
//         })
//     })
//
//     app.post("/auth/logout", middleware.verifyToken, (req, res) => {
//         // remove token from redis
//         // @ts-ignore
//         if (req.user) {
//             return res.status(200).json({
//                 success: true,
//                 statusCode: 200,
//             });
//         } else {
//             return res.status(400).json({
//                 success: true,
//                 statusCode: 400,
//                 errorMessage: "Đăng xuất không thành công",
//             });
//         }
//     })
// }