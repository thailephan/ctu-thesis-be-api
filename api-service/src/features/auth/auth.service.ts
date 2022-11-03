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
        let sql = `select * from users where email = $1 limit 1;`
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
