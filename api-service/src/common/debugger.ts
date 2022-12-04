export {};
import {format} from "date-fns";
const debug = require("debug");
const config = require("../config");

type DEBUG_LEVEL = "INFO" | "ERROR" | "WARN";

function bug(type: string) {
    return function (f: any, message: any, level: DEBUG_LEVEL = "INFO") {
        debug(`${config.server.NAME}:${type} | ${level} | ${f} |`)(`${format(new Date(), "dd-MM-yyyy HH:mm")} | ${JSON.stringify(message)}`);
    };
}

module.exports = {
    cassandra: bug("CASSANDRA"),
    websocket: bug("WEBSOCKET"),
    db: bug("DB"),
    middleware: bug("MIDDLEWARE"),
    kafka: bug("KAFKA"),
    api: bug("API"),
    helper: bug("HELPER"),
    debugger: bug,
}