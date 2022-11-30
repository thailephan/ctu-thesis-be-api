const { format } = require("date-fns");
const debug = require("debug");

function bug(type) {
    return function (f, message, level) {
        debug(`API-SERVICE| ${type} | ${level} | ${f} |`)(`${format(new Date(), "dd-MM-yyyy HH:mm")} | ${JSON.stringify(message)}`);
    };
}

module.exports = {
    cassandra: bug("CASSANDRA"),
    websocket: bug("WEBSOCKET"),
    socket: bug("SOCKET"),
    db: bug("DB"),
    middleware: bug("MIDDLEWARE"),
    kafka: bug("KAFKA"),
    api: bug("API"),
    helper: bug("HELPER"),
    debugger: bug,
}
