import {ICondition, IUser, IUserQueryParams} from "../../common/interface";

export {}
const db = require("../../repository");
const debug = require("../../common/debugger");
const { commonService } = require("../common");

// onlineStatus: 1 online, 2 offline, 3 busy, 4 not border
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
            "onlineStatus",
            ceil(extract(epoch from "lastOnlineTime")) as "lastOnlineTime",
            ceil(extract(epoch from "createdAt")) as "createdAt",
            ceil(extract(epoch from "updatedAt")) as "updatedAt",
            "createdBy",
            "updatedBy"
        from users`;
        const result = await db.query(sql);

        return result.rows;
    }
};