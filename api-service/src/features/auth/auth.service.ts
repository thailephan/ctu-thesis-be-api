import {IAccount} from "../../common/interface";

export {}
const db = require("../../repository");
const Helpers = require("../../common/helpers");

module.exports = {
    async getAccountByEmail(email: string) {
        if (Helpers.isNullOrEmpty(email)) {
           return null;
        }

        // New (Just select email, registerTypeId, email) for less effect jwt when update user data
        let sql = `select
                       "id",
                       "email",
                       "registerTypeId",
                       "hash"
            from users 
            where email = $1 limit 1;`
        const params = [email];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async createAccountMustActivate(account: IAccount) {
        const {fullName, email, hash, registerTypeId} = account;
        const params = [fullName, email, hash, registerTypeId];
        let sql = 'insert into users("fullName", "email", "hash", "registerTypeId", status) values($1, $2, $3, $4, 0)';
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async createAccount(account: IAccount) {
        const {fullName, email, hash, registerTypeId} = account;
        const params = [fullName, email, hash, registerTypeId];
        let sql = 'insert into users("fullName", "email", "hash", "registerTypeId") values($1, $2, $3, $4)';
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async addUserDevice(deviceData: { id: number, userAgent: string, platform: string | null, subscribeGroupId: string }) {
       const now = new Date();
       const sql = `insert into devices(platform, "userAgent", "createdAt", "updatedAt", "userId", "subscribeGroupId") VALUES ($1, $2, now(), now(), $3, $4) returning *`;
       const params = [deviceData.platform, deviceData.userAgent, deviceData.id, deviceData.subscribeGroupId];
       return (await db.query(sql, params)).rows[0];
    },
}
