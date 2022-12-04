export {};
import jwt from "jsonwebtoken";

const Helpers = require("../common/helpers");
const debug = require("../common/debugger");
const config = require("../config");

module.exports = {
    verifyToken(req, res, next) {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (token == null) {
            debug.middleware("verifyToken", `Not found token. Authorization Header: ${authHeader}`, "ERROR");
            return res.status(401).json({
                success: false,
                statusCode: 401,
                data: null,
                message: "Không tìm thấy bearer token"
            });
        }

        jwt.verify(token, config.token.accessTokenSecret, (err: any, decoded: any) => {
            if (err) {
                debug.middleware("verifyToken/jwt.verify", `Cannot decode token: ${err.message}`, "ERROR");

                return res.status(401).json({
                    statusCode: 401,
                    success: false,
                    data: null,
                    message: "Token không hợp lệ"
                });
            } else {
                debug.middleware("verifyToken/jwt.verify", `Decoded user: ${JSON.stringify(decoded)}`);
                req.user = decoded;
            }

            next()
        });
    }
}