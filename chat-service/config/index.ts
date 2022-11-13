require("dotenv").config();

module.exports = {
    server: require("./server.config"),
    token: require("./token.config"),
    apiService: require("./api-service.config"),
}
