export {}
const db = require("../../repository");
const Helpers = require("../../common/helpers");

// onlineStatus: 1 online, 2 offline, 3 busy, 4 not border
module.exports = {
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
    updateUser: async ({id, fullName, birthday, gender, phoneNumber}: any) => {
        let columns = [];
        const params = [id];
        if (!Helpers.isNullOrEmpty(birthday)) {
            params.push(birthday);
            columns.push("birthday = to_timestamp($" + (params.length) + ")");
        }
        if (!Helpers.isNullOrEmpty(gender)) {
            params.push(gender);
            columns.push("gender = $" + params.length);
        }
        if (!Helpers.isNullOrEmpty(phoneNumber)) {
            params.push(phoneNumber);
            columns.push(`"phoneNumber" = $` + params.length);
        }
        if (!Helpers.isNullOrEmpty(fullName)) {
            params.push(fullName);
            columns.push(`"fullName" = $` + params.length);
        }
// "fullName" = $2, birthday = to_timestamp($3), gender = $4, "phoneNumber" = $5
        const sql = `update users set ${columns.join(", ")}, "createdAt" = now() where id = $1
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
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    updateUserAvatar: async ({id, avatarUrl}: any) => {
        const sql = `update users set "avatarUrl" = $2 , "createdAt" = now() where id = $1`;
        const params = [id, avatarUrl];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    // TODO: user cannot login after lock account
    lockUser: async ({ userId }: any) => {
        const sql = `update users set status = 2, "createdAt" = now() where id = $1
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
    },
    getUserInformation: async (id: string) => {
        const sql = `select id,
            ceil(extract(epoch from birthday::timestamp))::int as "birthday",
            "fullName", "phoneNumber", "avatarUrl", email, gender 
            from users where id = $1 and status = 1`;
        return (await db.query(sql, [id])).rows[0];
    },
    getAccountById: async (id: string) => {
        // TODO: add `status = 1` to check existed user
        const sql = `select * from users where id = $1`;
        return (await db.query(sql, [id])).rows[0];
    },
    updateUserPassword: async (id: any, hash: string) => {
        const sql = `update users set hash = $1, "updatedAt" = now() where id = $2 returning *`;
        return (await db.query(sql, [hash, id])).rows[0];
    },
    searchUser: async ({searchText}) => {
        const sql = `select lower("fullName") LIKE lower($1) "isFindInFullName",
                     lower("email") LIKE lower($1) "isFindInEmail", "fullName", id, email, "avatarUrl", "phoneNumber"
                     from users
                     where lower(email) LIKE lower($1) or lower("fullName") LIKE lower($1) and status = 1;`
        return (await db.query(sql, [`%${searchText}%`])).rows;
    },
    getUserByEmail: async ({email}) => {
        const sql = `select id, "fullName", email
                     from users
                     where email = $1
                     limit 1`;
        return (await db.query(sql, [email])).rows[0];
    },
    changePassword: async ({email, hash}: any) => {
        const sql = `update users
                     set hash = $1
                     where email = $2 returning id, "fullName", email`;
        return (await db.query(sql, [hash, email])).rows[0];
    }
};