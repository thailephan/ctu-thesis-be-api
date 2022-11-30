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
    searchUser: async ({searchText, userId}) => {
        console.log(searchText, userId);
        const sql = `
            select lower("fullName") LIKE lower($2) "isFindInFullName",
                    lower("email") LIKE lower($2) "isFindInEmail", "fullName", id, email, "avatarUrl", "phoneNumber",
                   (("userId2" = $1 and "userId1" = users.id) or ("userId1" = $1 and "userId2" = users.id)) "isFriend",
                    ("receiverId" = id) "isInvitationReceiver", ("senderId" = id) "isInvitationSender"
            from users
                join friends on (users.id = friends."userId1" or users.id = friends."userId2")
                left join invitations i on ((users.id = i."receiverId" and "senderId" = $1) or (users.id = i."senderId" and "receiverId" = $1))
            where (lower(email) LIKE lower($2) or lower("fullName") LIKE lower($2)) and users.status = 1 and friends.status = 1 and not id = $1;`
        return (await db.query(sql, [userId, `%${searchText}%`])).rows;
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