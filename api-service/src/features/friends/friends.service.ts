import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
const { BASE_SQL_FRIENDS } = require("../../common/constants");
const { commonService } = require("../common");

module.exports = {
    ...commonService,
    async getAllByUserId(id: string) {
        const sql = `
            select ceil(extract(epoch from friends."createdAt"))::int as "friendSince",
                   case when "userId1" = $1 then user2."fullName"
                        when "userId2" = $1 then user1."fullName"
                   end as "fullName",
                   case
                       when "userId1" = $1 then user2."avatarUrl"
                       when "userId2" = $1 then user1."avatarUrl"
                   end as "avatarUrl",
                   case
                   when "userId1" = $1 then user2.id
                       when "userId2" = $1 then user1.id
                   end as "friendId",
                   case
                       when "userId1" = $1 then user2.email
                       when "userId2" = $1 then user1.email
                   end as email
            from friends
                join users user1
            on user1.id = friends."userId1"
                join users user2 on user2.id = friends."userId2" where "userId1" = $1 or "userId2" = $1 and friends.status = 1;
        `;
        const params = [id]
        const result = await db.query(sql, params);
        debug.db("friends-service", {
            rows: result.rows, params,
        });
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
            console.log(channel.id, userId1, userId2);
            // TODO: Returning channel of user with id
            await client.query('END;');
            await client.query('COMMIT');
            return (await db.query(sqlUpdateChannel, [channel.id])).rows[0];
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
        return {};
    }
};
