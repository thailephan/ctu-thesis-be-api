import {Express} from "express";

module.exports = (app: Express) => {
    require("./auth.controller")(app);
}
