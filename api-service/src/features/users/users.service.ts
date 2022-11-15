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
            ceil(extract(epoch from "birthday"::timestamp))::int as "birthday",
            "gender",
            "phoneNumber",
            "avatarUrl",
            "status",
            "onlineStatus",
            ceil(extract(epoch from "lastOnlineTime"::timestamp))::int as "lastOnlineTime",
            ceil(extract(epoch from "createdAt"::timestamp))::int as "createdAt",
            ceil(extract(epoch from "updatedAt"::timestamp))::int as "updatedAt",
            "createdBy",
            "updatedBy"
        from users`;
        const result = await db.query(sql);

        return result.rows;
    },
    updateUser: async ({id, fullName, birthday, gender, phoneNumber, avatarUrl}: any) => {
        const sql = `update users set "fullName" = $2, birthday = to_timestamp($3), gender = $4, "phoneNumber" = $5, "avatarUrl" = $6 where id = $1
            returning    "id",
                         "fullName",
                         "registerTypeId",
                         "email",
                         ceil(extract(epoch from "birthday"::timestamp))::int as "birthday",
                         "gender",
                         "phoneNumber",
                         "avatarUrl",
                         "status",
                         "onlineStatus",
                         ceil(extract(epoch from "lastOnlineTime"::timestamp))::int as "lastOnlineTime",
                         ceil(extract(epoch from "createdAt"::timestamp))::int as "createdAt",
                         ceil(extract(epoch from "updatedAt"::timestamp))::int as "updatedAt",
                         "createdBy",
                         "updatedBy"`;
        const params = [id, fullName, birthday, gender, phoneNumber, avatarUrl];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    // TODO: user cannot login after lock account
    lockUser: async ({ userId }: any) => {
        const sql = `update users set status = 2 where id = $1
                         returning "id",
                         "fullName",
                         "registerTypeId",
                         "email",
                         ceil(extract(epoch from "birthday"::timestamp))::int as "birthday",
                         "gender",
                         "phoneNumber",
                         "avatarUrl",
                         "status",
                         "onlineStatus",
                         ceil(extract(epoch from "lastOnlineTime"::timestamp))::int as "lastOnlineTime",
                         ceil(extract(epoch from "createdAt"::timestamp))::int as "createdAt",
                         ceil(extract(epoch from "updatedAt"::timestamp))::int as "updatedAt",
                         "createdBy",
                         "updatedBy";
        `;
        const result = await db.query(sql, [userId]);
        return result.rows[0];
    }
};