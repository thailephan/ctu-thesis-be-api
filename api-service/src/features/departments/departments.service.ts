import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");

module.exports = {
    async count(condition: ICondition) {
        const { search } = condition;
        try {
            let sql = `select count(*) from department`;
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
        let sql = `select 
            id, created_by, updated_by, name, status,
            ceil(extract(epoch from created_at)) as created_at,
            ceil(extract(epoch from updated_at)) as updated_at
            from department where status >= 1`
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
    async getById(id: string) {
        const sql = `select
                 id, created_by, updated_by, name, status,
                 ceil(extract(epoch from created_at)) as created_at,
                 ceil(extract(epoch from updated_at)) as updated_at
            from department where id = $1`;
        const params = [id]
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async create({name, created_by = null, updated_by = null, status = 1}: {name: string, created_by: number | null, updated_by: number | null, status: number}) {
        const now = new Date();
        const query = `insert into department(name, created_by, updated_by, updated_at, created_at, status) VALUES ($1, $2, $3, $4, $5, $6) returning *`;
        const params = [name, created_by, updated_by, now, now, status];

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
