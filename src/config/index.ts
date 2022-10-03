require("dotenv").config();

module.exports = {
   server: require("./server.config"),
   db: require("./db.config"),
   firebase: require("./firebase.config"),
   helpers: require("./helpers.config"),
   token: require("./token.config"),
}