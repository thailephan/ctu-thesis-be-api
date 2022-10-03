import {Express} from "express";

module.exports = (app: Express) => {
    require("./auth-google.controller")(app);
    require("./auth.controller")(app);
}
