import {LogType} from "../common/logging";

export {};
import jwt from "jsonwebtoken";

const Helpers = require("../common/helpers");
const debug = require("../common/debugger");
const config = require("../config");
const producer = require("../common/kafka").producer;
const {redis} = require("../common/redis");

module.exports = {
    async verifyToken(req, res, next) {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (token == null) {
            debug.middleware("verifyToken", `Not found token. Authorization Header: ${authHeader}`, "ERROR");
            await producer.send(Helpers.getKafkaLog(req, {
                messages: [{
                    value: {
                        type: LogType.Error,
                        message: "Not found token",
                        data: { auth: authHeader },
                        executedFunction: "MIDDLEWARE verifyToken",
                    }
                },]
            }));
            return res.status(401).json({
                success: false,
                statusCode: 401,
                data: null,
                message: "Không tìm thấy bearer token"
            });
        }

        const jsonAccount = await redis.get(`auth/tokens/${token}`);
        console.log("isTokenValid", jsonAccount);
        if (!jsonAccount) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                data: null,
                message: "Không tìm thấy tài khoản với token"
            });
        }

        const account = JSON.parse(jsonAccount);

        debug.middleware("verifyToken/jwt.verify", `User: ${jsonAccount}`);
        await producer.send(Helpers.getKafkaLog(req, {
            messages: [{
                value: {
                    type: LogType.Ok,
                    message: "Verified",
                    data: { auth: authHeader, userId: account.id },
                    executedFunction: "MIDDLEWARE verifyToken | jwt.verify",
                }
            },]
        }));
        req.user = account;
        next();
    }
}