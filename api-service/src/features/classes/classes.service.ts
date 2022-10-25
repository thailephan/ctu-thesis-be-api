import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");

module.exports = {
    async count(condition: ICondition) {
        const { search } = condition;
        try {
            let sql = `select count(*) from classes`;
            if (search) {
                sql += ` where status >= 1 and name LIKE '%${search}%' and not college_id is null and not course_id is null`
            }
            debug.db({search, sql})
            const result = await db.query(sql);
            return parseInt(result.rows[0].count);
        } catch (e) {
            debug.db(`error ${e}`);
            return 0;
        }
    },
    async getAll(queryParams: IQueryParams = {}) {
        const {sort, search, offset, limit} = queryParams;
        let sql = `
                select c.id,
                       c.name,
                       c.updated_by,
                       c.created_by,
                       c.status,
                       courses.name                           as course_name,
                       department.name                        as department_name,
                       colleges.name                          as college_name,
                       ceil(extract(epoch from c.created_at)) as created_at,
                       ceil(extract(epoch from c.updated_at)) as updated_at
                     from classes c
                    join courses on c.course_id = courses.id
                         join colleges on c.college_id = colleges.id
                         join department on colleges.department_id = department.id
            where c.status >= 1`
        const params: any[] = [];

        if (search) {
            sql += ` and c.name LIKE '%${search}%'`;
        }
        if (!Helpers.isNullOrEmpty(sort)) {
            sql += ` order by ${sort}`;
        }
        if (!Helpers.isNullOrEmpty(offset)) {
            params.push(offset);
            sql += ` offset $${params.length}`;
        }
        if (!Helpers.isNullOrEmpty(limit)) {
            params.push(limit);
            sql += ` limit $${params.length}`;
        }
        sql += ";";
        debug.db({sql, params});
        const result = await db.query(sql, params);

        return result.rows;
    },
    async getById(id: string) {
        const sql = `select c.id,
                            c.name,
                            c.updated_by,
                            c.created_by,
                            c.status,
                            courses.name                           as course_name,
                            department.name                        as department_name,
                            colleges.name                          as college_name,
                            ceil(extract(epoch from c.created_at)) as created_at,
                            ceil(extract(epoch from c.updated_at)) as updated_at
                     from classes c
                    join courses on c.course_id = courses.id
                         join colleges on c.college_id = colleges.id
                         join department on colleges.department_id = department.id
                     where c.id = $1`;
        const params = [id]
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async create({name, course_id, college_id, created_by = null, updated_by = null, status = 1}: {name: string, course_id: number, college_id: number, created_by, updated_by, status}) {
        const now = new Date();
        const query = `insert into classes(name, college_id, course_id, created_by, updated_by, updated_at, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) returning *`;
        const params = [name, college_id, course_id, created_by, updated_by, now, now, status];

        const result = await db.query(query, params);
        return result.rows[0];
    },

    // async update({id, name = null, course_id = null, college_id = null, status = 1, updated_by = null}: {id: string, name: string, course_id: string, college_id: string, updated_by: string, status: number}) {
    //     const sql = 'update classes set name = $1, course_id = $2, college_id = $3, updated_at = $4, updated_by = $5, status = $6 WHERE id = $7';
    //     // const sql = 'DELETE FROM classes WHERE id = $1';
    //     const params = [name, course_id, college_id, (new Date()).getTime(), updated_by, status, id];
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