export {};
const db = require("../../repository");
const Constants = require("../../common/constants");

module.exports = {
    async getAllByUserId(id: string) {
        const sql = `
            with f as (select ceil(extract(epoch from friends."createdAt"))::int as "friendSince",
                   case
                   when "userId1" = $1 then user2.id
                       when "userId2" = $1 then user1.id
                   end as "friendId",
       case
           when "userId1" = $1 then user1.id
           when "userId2" = $1 then user2.id
           end as "requestUserId",
       case
           when "userId1" = $1 then user2.email
           when "userId2" = $1 then user1.email
           end as email,
       case
           when "userId1" = $1 then user2."avatarUrl"
           when "userId2" = $1 then user1."avatarUrl"
           end as "avatarUrl",
       case
           when "userId1" = $1 then user2."fullName"
           when "userId2" = $1 then user1."fullName"
           end as "fullName"
from friends
         join users user1
              on user1.id = friends."userId1"
         join users user2 on user2.id = friends."userId2"
where friends.status = 1
  and ("userId1" = $1 or "userId2" = $1) )
            select f.*, cm1."channelId" from f
                join channelMembers cm1 on cm1."memberId" = "requestUserId"
                join channelMembers cm2 on cm2."memberId" = "friendId" and cm2."channelId" = cm1."channelId"
                join channels c on cm2."channelId" = c.id
            where c."channelTypeId" = 1 and c.status = 1;
        `;
        const params = [id]
        const result = await db.query(sql, params);
        return result.rows;
    },
    unFriend: async ({userId1, userId2}) => {
        const client = await db.getClient();
        try {
            await client.query('BEGIN;');
            const sql = `update friends
                     set status = -1
                     where ("userId1" = $1 and "userId2" = $2) or ("userId1" = $1
                       and "userId2" = $1);`;
            const params = [userId1, userId2];
            const result = await db.query(sql, params);

            const channelSql = `select id from channelmembers cm join channels c on cm."channelId" = c.id
                join (select id as "channelId", "memberId" from channelmembers cm2 join channels c on cm2."channelId" = c.id where "channelTypeId" = 1 and "memberId" = $1) temp on temp."channelId" = c.id
            where "channelTypeId" = 1 and cm."memberId" = $2 order by id desc limit 1;
        `;
            const channel = (await db.query(channelSql, [userId1, userId2])).rows[0];
            const sqlUpdateChannel = `update channels
                                  set status = -1
                                  where (id = $1 and "channelTypeId" = 1) returning *;`;
            const g = await db.query(sqlUpdateChannel, [channel.id]);
            // TODO: Returning channel of user with id
            await client.query('END;');
            await client.query('COMMIT');
            return g.rows[0];
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
        return {};
    },
    searchUsers: async ({ id, searchText = "", pageSize = Constants.PAGE_LIMIT }) => {
        const sql = `
            with f as (select ceil(extract(epoch from friends."createdAt"))::int as "friendSince",
                   case
                   when "userId1" = $1 then user2.id
                       when "userId2" = $1 then user1.id
                   end as "friendId",
       case
           when "userId1" = $1 then user1.id
           when "userId2" = $1 then user2.id
           end as "requestUserId",
       case
           when "userId1" = $1 then user2.email
           when "userId2" = $1 then user1.email
           end as email,
       case
           when "userId1" = $1 then user2."avatarUrl"
           when "userId2" = $1 then user1."avatarUrl"
           end as "avatarUrl",
       case
           when "userId1" = $1 then user2."fullName"
           when "userId2" = $1 then user1."fullName"
           end as "fullName"
from friends
         join users user1
              on user1.id = friends."userId1"
         join users user2 on user2.id = friends."userId2"
where friends.status = 1
  and ("userId1" = $1 or "userId2" = $1) )
            select f.*, cm1."channelId", lower(f."fullName") LIKE lower($2) "isFindInFullName",
            lower("email") LIKE lower($2) "isFindInEmail"
            from f
                join channelMembers cm1 on cm1."memberId" = "requestUserId"
                join channelMembers cm2 on cm2."memberId" = "friendId" and cm2."channelId" = cm1."channelId"
                join channels c on cm2."channelId" = c.id 
            where c."channelTypeId" = 1 and (lower(email) LIKE lower($2) or lower("fullName") LIKE lower($2)) ORDER BY "friendSince" limit $3 ;
        `;
        const params = [id, `%${searchText}%`, pageSize];
        const result = await db.query(sql, params);
        return result.rows;
    }
};
