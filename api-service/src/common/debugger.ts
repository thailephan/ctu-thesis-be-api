export {};
import {format} from "date-fns";
const debug = require("debug");

type DEBUG_LEVEL = "INFO" | "ERROR" | "WARN";

function bug(type: string) {
    return function (f: any, message: any, level: DEBUG_LEVEL = "INFO") {
        debug(`API-SERVICE| ${type} | ${level} | ${f} |`)(`${format(new Date(), "dd-MM-yyyy HH:mm")} | ${JSON.stringify(message)}`);
    };
}

module.exports = {
    cassandra: bug("CASSANDRA"),
    websocket: bug("websocket"),
    db: bug("DB"),
    middleware: bug("MIDDLEWARE"),
    kafka: bug("KAFKA"),
    api: bug("API"),
    helper: bug("helper"),
}
