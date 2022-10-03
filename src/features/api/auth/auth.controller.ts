import {ITokenPayload} from "../../../common/interface";

export {}
import { Express } from "express";
import bcrypt from "bcryptjs";
const Helpers = require("../../../common/helpers");
const debug = require("../../../common/debugger");
const middleware = require("../../../middleware");
const service = require('./auth.service');

module.exports = (app: Express) => {
    app.post("/auth/login", async (req, res) => {
        const {username, password} = req.body;
        if ([username, password].some(v => Helpers.isNullOrEmpty(v))) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessage: "Invalid username or password",
            });
        }
        const account = await service.getAccountByUsername(username);
        if (Helpers.isNullOrEmpty(account)) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessaage: "wrong username",
            });
        }
        // check password
        const match = await bcrypt.compare(password, account.hash);
        debug.api({account, match})
        if (!match) {
            return res.status(400).json({
                success: false,
                statusCode: 400,
                errorMessaage: "wrong password",
            });
        }
        const payload: ITokenPayload = {
            username: account.username,
            role: account.role,
            full_name: account.full_name,
            class_id: account.class_id,
            course_id: account.course_id,
        };
        return res.status(200).json({
            success: true,
            statusCode: 200,
            data: {
                access_token: Helpers.generateToken(payload),
            },
        })
    })
    app.post("/auth/logout", middleware.verifyToken, (req, res) => {
        // remove token from redis
        // @ts-ignore
        if (req.user) {
            res.status(200).json({
                success: true,
                statusCode: 200,
            })
        }
    })
    app.post("/auth/register", async (req, res) => {
        const {username, password} = req.body;
        if (Helpers.isNullOrEmpty(username) || Helpers.isNullOrEmpty(password)) {
            return res.status(400).json({
                success: false,
                errorMessage: "Invalid username and password",
                statusCode: 400,
            });
        }
        const hash = await Helpers.hash(password);
        const default_account: any = {
            username,
            hash,
            role: 1,
            register_type: 2,
            account_verified: false
        };
        if (Helpers.isEmail(username)) {
            default_account.email = username;
        }
        try {
            // create account with username and password
            const new_account = await service.createAccount(default_account) || {};

            const payload: ITokenPayload = {
                username: new_account.username,
                role: new_account.role,
                full_name: null,
                class_id: null,
                course_id: null,
            };
            // return success with login token
            return res.status(200).json({
                success: true,
                statusCode: 200,
                data: {
                    access_token: Helpers.generateToken(payload),
                },
            })
        } catch (e) {
            let message = e.message;
            if (e.message === 'duplicate key value violates unique constraint \"users_email_key\"') {
                message = "User has existed";
            }
            return res.status(400).json({
                success: false,
                statusCode: 200,
                errorMessage: message,
            });
        }
    })
}