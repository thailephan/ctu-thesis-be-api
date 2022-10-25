export {};
import jwt from "jsonwebtoken";

const Helpers = require("../common/helpers");
const debug = require("../common/debugger");
const config = require("../config");

module.exports = {
   filterGetList(req, res, next) {
       debug.middleware(req.query);
       const page = parseInt((req.query.page as string)) || null;
       const size = parseInt((req.query.size as string)) || null;
       const start_read_message = parseInt((req.query.start_read_message as string)) || null;
       const limit = parseInt((req.query.limit as string)) || null;
       const sort = Helpers.extractSort(req.query.sort);

       const isBothNotExist = Helpers.isNullOrEmpty(page) && Helpers.isNullOrEmpty(size);
       const isBothExist = !Helpers.isNullOrEmpty(page) && !Helpers.isNullOrEmpty(size);
       // TODO: verify size > 0, page > 0, search (!= number), sort abc (ASC, name DESC)
       if (!(isBothExist || isBothNotExist)) {
           return res.status(400).json({
               success: false,
               statusCode: 400,
               errorMessage: "required both page and size field",
           });
       }
       if (isBothExist && (page <= 0 || size <= 0)) {
           return res.status(400).json({
               success: false,
               statusCode: 400,
               errorMessage: "page or size must larger than 0",
           });
       }

       // Check start_read_message and limit of messages

       req.query.size = size;
       req.query.page = page;
       req.query.sort = sort;
       req.query.start_read_message = start_read_message; // api: messages
       req.query.limit = limit; // api: messages

       next();
    },
    verifyToken(req, res, next) {
        const authHeader = req.headers['authorization']
        const token = authHeader && authHeader.split(' ')[1]

        if (token == null)
            return res.status(401).json({
                success: false,
                statusCode: 401,
                errorMessage: "Không tìm thấy bearer token"
            });

        jwt.verify(token, config.token.access_token_secret, (err: any, decoded: any) => {
            if (err) {
                debug.middleware(err)

                return res.status(401).json({
                    success: false,
                    statusCode: 401,
                    errorMessage: "Token không hợp lệ"
                });
            } else {
                req.user = decoded;
            }

            next()
        })
    }
}