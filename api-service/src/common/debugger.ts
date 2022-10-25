export {};
const debug = require("debug");

module.exports = {
    websocket: debug("app:websocket"),
    api: debug("app:api"),
    cassandra: debug("app:cassandra"),
    db: debug("app:db"),
    dbError: debug("app:db: error"),
    middleware: debug("app:middleware"),
    debugger: (type: string, ...msg: any) => debug(`app:${type}`)(...msg),
}