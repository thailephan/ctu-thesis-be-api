import {ICondition, IUser, IUserQueryParams} from "../../common/interface";

export {}
const db = require("../../repository");
const debug = require("../../common/debugger");
let base_sql = `
    select
        u.id,
        full_name,
        birthday,
        gender,
        phone_number, address,
        ceil(extract(epoch from u.created_at)) as created_at,
        ceil(extract(epoch from u.updated_at)) as updated_at,
        u.updated_by, u.created_by,
        email,
        u.status,
        ua.username,
        ua.role as account_role,
        ua.register_type as account_register_type,
        ua.account_verified,
        class_id,
        c.name as class_name,
        course_id,
        co.name as course_name,
        college_id,
        cl.name as college_name,
        department_id,
        d.name as department_name
    from users u left join user_accounts ua on u.id = ua.user_id
        left join classes c on u.class_id = c.id
        left join courses co on c.course_id = co.id
        left join colleges cl on c.college_id = cl.id
        left join department d on cl.department_id = d.id
`;

module.exports = {
    async count(condition: ICondition) {
        const { search } = condition;
        try {
            let sql = `select count(*) from users`;
            if (search) {
                sql += ` where status >= 1 and u.name LIKE '%${search}%'`
            }
            const result = await db.query(sql);

            return parseInt(result.rows[0].count);
        } catch (e) {
            debug.db(`error ${e}`);
            return 0;
        }
    },
    async getAll(queryParams: IUserQueryParams = {}) {
        const {sort, search, offset, limit} = queryParams;
        const params: any[] = [];
        let sql = base_sql;

        if (search) {
            sql += `where status >= 1 and u.name LIKE '%${search}%'`;
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
        const sql = `${base_sql} where u.id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    async getByCollegeId(id: string) {
        const sql = `${base_sql} where c.college_id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    },
    async getByCourseId(id: string) {
        const sql = `${base_sql} where c.course_id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    },
    async getByClassId(id: string) {
        const sql = `${base_sql} where u.class_id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    },
    async getByDepartmentId(id: string) {
        const sql = `${base_sql} where cl.department_id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    },
    async create({email, full_name, birthday, gender, phone_number, address, class_id, created_by, updated_by, status = 1}: IUser) {
        const now = new Date();
        let sql = `insert into
                    users (email, full_name, birthday, gender, phone_number, address, class_id, created_by, created_at, updated_by, updated_at, status)
                    values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning *`;
        const params = [email, full_name, birthday, gender, phone_number, address, class_id, created_by, now, updated_by, now, status];

        const result = await db.query(sql, params);
        return result.rows[0];
    },

//    Utils
    async getClassById(id: string) {
        const sql = 'select * from classes where id = $1 limit 1';
        const params = [id];

        const result = await db.query(sql, params);
        return result.rows[0];
    }
};