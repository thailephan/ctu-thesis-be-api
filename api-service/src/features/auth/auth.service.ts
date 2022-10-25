import {IAccount} from "../../common/interface";

export {}
const db = require("../../repository");
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");

module.exports = {
    async getAccountByEmail(email: string) {
        let sql = `
            select "userId",
                   uA.email as email,
                   hash,
                   "registerTypeId",
                   uA.status,
                   u."classId" as "classId"
            from userAccounts uA
            join users u on u.id = uA."userId" where uA.email = $1
            limit 1;`
        const params = [email];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async createAccount(account: IAccount) {
        const {email, hash, registerTypeId} = account;
        const client = await db.getClient();

        const user_params = [Helpers.isNullOrEmpty(email) ? null : email];

        try {
            await client.query('BEGIN');
            const queryText = 'insert into users(email) values($1) returning id;';
            const res = await client.query(queryText, user_params);

            const user_account_params = [hash, registerTypeId, res.rows[0].id, email];
            const sql_account = `insert into userAccounts
                (hash, registerTypeId, userId, email)
                    values($1, $2, $3, $4) returning *;`;
            const result = await client.query(sql_account, user_account_params);
            debug.db(user_account_params);

            await client.query('COMMIT');

            debug.db(result.rows[0]);
            return result.rows[0];
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    },
}
