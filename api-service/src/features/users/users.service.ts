import {ICondition, IUser, IUserQueryParams} from "../../common/interface";

export {}
const db = require("../../repository");
const debug = require("../../common/debugger");
const { commonService } = require("../common");

module.exports = {
    ...commonService,
    getAll: async () => {
        const sql = `select 
            "id",
            "fullName",
            "registerTypeId",
            "email",
            "birthday",
            "gender",
            "phoneNumber",
            "avatarUrl",
            "status",
            ceil(extract(epoch from "createdAt")) as "createdAt",
            ceil(extract(epoch from "updatedAt")) as "updatedAt",
            "createdBy",
            "updatedBy"
        from users`;
        const result = await db.query(sql);

        return result.rows;
    }
};