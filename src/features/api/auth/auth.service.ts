import {IAccount} from "../../../common/interface";

export {}
const db = require("../../../repository");
const Helpers = require("../../../common/helpers");
const debug = require("../../../common/debugger");

module.exports = {
    async getAccountByUsername(username: string) {
        let sql = `
            select user_id,
                   username,
                   hash,
                   role,
                   register_type,
                   account_verified,
                   a.created_by,
                   a.updated_by,
                   a.status,
                   ceil(extract(epoch from a.created_at)) as created_at,
                   ceil(extract(epoch from a.updated_at)) as updated_at,
                   u.email,
                   full_name,
                   class_id
            from user_accounts a join users u
            on u.id = a.user_id
            where username = $1
            limit 1`
        const params = [username];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async createAccount(account: IAccount) {
        const {username, hash, role = 1, status = 1, account_verified = false, register_type = 2, email} = account;
        const now = new Date();
        const client = await db.getClient();

        const user_params = [now, now, status, Helpers.isNullOrEmpty(email) ? null : email];

        try {
            await client.query('BEGIN');
            const queryText = 'insert into users(created_at, updated_at, status, email) values($1, $2, $3, $4) returning id;';
            const res = await client.query(queryText, user_params);

            const user_account_params = [username, role, hash, now, now, status, account_verified, register_type, res.rows[0].id];
            const sql_account = `insert into user_accounts
                (username, role, hash, created_at, updated_at, status, account_verified, register_type, user_id)
                    values($1, $2, $3, $4, $5, $6, $7, $8, $9) returning *;`;
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
