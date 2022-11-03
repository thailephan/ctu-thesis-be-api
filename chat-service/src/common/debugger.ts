export {};
const debug = require("debug");

module.exports = {
    websocket: debug("app:websocket"),
    socket: debug("app:socket"),
    cassandra: debug("app:cassandra"),
    db: debug("app:db"),
    dbError: debug("app:db: error"),
    middleware: debug("app:middleware"),
    debugger: (type: string, msg: string) => debug(`app:${type}`)(msg),
}