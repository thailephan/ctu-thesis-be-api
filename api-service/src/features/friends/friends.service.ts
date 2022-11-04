import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
const { BASE_SQL_FRIENDS } = require("../../common/constants");
const { commonService } = require("../common");

module.exports = {
    ...commonService,
    async getAllByUserId(id: string) {
        const sql = `
            select ceil(extract(epoch from friends."createdAt")) as "friendSince",
                   case when not "userId1" = $1 then user2."fullName"
                        when not "userId2" = $1 then user1."fullName"
                   end as "fullName",
                   case
                       when not "userId1" = $1 then user2."avatarUrl"
                       when not "userId2" = $1 then user1."avatarUrl"
                   end as "avatarUrl",
                   case
                   when not "userId1" = $1 then user2.id
                       when not "userId2" = $1 then user1.id
                   end as "friendId",
                   case
                       when not "userId1" = $1 then user2.email
                       when not "userId2" = $1 then user1.email
                   end as email
            from friends
                join users user1
            on user1.id = friends."userId1"
                join users user2 on user2.id = friends."userId2" where "userId1" = $1 or "userId2" = $1;
        `;
        const params = [id]
        const result = await db.query(sql, params);
        debug.db("friends-service", {
            rows: result.rows, params,
        });
        return result.rows;
    },
};
