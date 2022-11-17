import {IAccount} from "../../common/interface";

export {}
const db = require("../../repository");
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");

module.exports = {
    async getAccountByEmail(email: string) {
        if (Helpers.isNullOrEmpty(email)) {
           return null;
        }
        // Old select (all data)
        // let sql = `select
        //                "id",
        //                "fullName",
        //                "registerTypeId",
        //                "email",
        //                hash,
        //                "tempHash",
        //                ceil(extract(epoch from "birthday"::timestamp))::int as "birthday",
        //                "gender",
        //                "phoneNumber",
        //                "avatarUrl",
        //                "status",
        //                "onlineStatus",
        //                ceil(extract(epoch from "lastOnlineTime"::timestamp))::int as "lastOnlineTime",
        //                ceil(extract(epoch from "createdAt"::timestamp))::int as "createdAt",
        //                ceil(extract(epoch from "updatedAt"::timestamp))::int as "updatedAt",
        //                "createdBy",
        //                "updatedBy"
        //     from users where email = $1 limit 1;`

        // New (Just select email, registerTypeId, email) for less effect jwt when update user data
        let sql = `select
                       "id",
                       "email",
                       "registerTypeId",
                       "hash"
            from users where email = $1 limit 1;`
        const params = [email];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async createAccount(account: IAccount) {
        const {fullName, email, hash, registerTypeId} = account;
        const params = [fullName, email, hash, registerTypeId];

        let sql = 'insert into users("fullName", "email", "hash", "registerTypeId") values($1, $2, $3, $4)';
        const result = await db.query(sql, params);
        console.log(result);
        return result.rows[0];
    },
}
