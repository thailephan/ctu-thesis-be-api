require("dotenv").config();

module.exports = {
    server: require("./server.config"),
    token: require("./token.config"),
    service: require("./service.config"),
}
