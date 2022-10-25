import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
let base_sql = `
    select id_sender, id_receiver, fr.created_by, fr.updated_by, fr.status,
           ceil(extract(epoch from fr.created_at)) as created_at,
           ceil(extract(epoch from fr.updated_at)) as updated_at,
           us.full_name as sender,
           ur.full_name as receiver
    from friend_requests fr
            join users us on us.id = fr.id_sender
        left join users ur on ur.id = fr.id_receiver
`

module.exports = {
    async count(condition: ICondition) {
        const { search } = condition;
        try {
            let sql = `select count(*) from friend_requests`;
            if (search) {
                sql += ` where status >= 1 and name LIKE '%${search}%'`
            }
            const result = await db.query(sql);
            return parseInt(result.rows[0].count);
        } catch (e) {
            debug.db(`error ${e}`);
            return 0;
        }
    },
    async getAll(queryParams: IQueryParams = {}) {
        const {sort, search, offset, limit} = queryParams;
        let sql = `${base_sql} where fr.status >= 1`
        const params: any[] = [];

        if (search) {
            sql += ` and name LIKE '%${search}%'`;
        }
        if (sort) {
            sql += ` order by ${sort}`;
        }
        if (offset) {
            params.push(offset);
            sql += ` offset $${params.length}`;
        }
        if (limit) {
            params.push(limit);
            sql += ` limit $${params.length}`;
        }
        sql += ";";
        debug.db({sql, params});
        const result = await db.query(sql, params);

        return result.rows;
    },
    async getByReceiverId(id: string) {
        const sql = `${base_sql} where id_sender = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    },
    async getBySenderId(id: string) {
        const sql = `${base_sql} where id_receiver = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    },
    async getById(id: string) {
        const sql = `${base_sql} where id_sender = $1 OR id_receiver = $1`;
        const params = [id]
        const result = await db.query(sql, params);
        return result.rows;
    },
    async create({created_by, id_receiver, id_sender, status = 1, updated_by}: {id_sender: number, id_receiver:  number, status: number, created_by: number, updated_by: number}) {
        const now = new Date();
        const query = `insert into friend_requests(id_sender, id_receiver, updated_by, created_by, status, updated_at, created_at) values ($1, $2, $3, $4, $5, $6, $7) returning *`;
        const params = [id_sender, id_receiver, updated_by, created_by, status, now, now];

        const result = await db.query(query, params);
        return result.rows[0];
    },

    // async update({id, name = null, course_id = null, college_id = null, status = 1, updated_by = null}: {id: string, name: string, course_id: string, college_id: string, updated_by: string, status: number}) {
    //     const sql = 'update classes set name = $1, course_id = $2, college_id = $3, updated_at = $4, updated_by = $5, status = $6 WHERE id = $7';
    //     // const sql = 'DELETE FROM classes WHERE id = $1';
    //     const params = [name, (new Date()).getTime(), updated_by, status, id];
    //     const result = await db.query(sql, params);
    //     return result.rows[0] || null;
    // },
    // async delete(id: string) {
    //     const sql = 'update classes set status = -1,  updated_at = $1 where id = $2';
    //     // const sql = 'DELETE FROM classes WHERE id = $1';
    //     const params = [(new Date()).getTime(), id];
    //     try {
    //         const result = await db.query(sql, params);
    //         return result.rows[0] || null;
    //     } catch (e) {
    //         debug.db(e);
    //         return null;
    //     }
    // }
};
