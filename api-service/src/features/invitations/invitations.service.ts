import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = {
    getAllByUserId: async (id: string) => {
        // const sql = `
        //     select invitations."createdAt" as "createdAt",
        //            "senderId", fromUser."fullName" as "senderFullname", fromUser.email as "senderEmail", fromUser."avatarUrl" as "senderAvatarUrl",
        //            "receiverId", toUser."fullName" as "receiverFullname", toUser.email as "receiverEmail", toUser."avatarUrl" as "receiverAvatarUrl"
        //     from invitations
        //         join users fromUser on invitations."senderId" = fromUser.id
        //         join users toUser on invitations."receiverId" = toUser.id
        //     where "senderId" = $1 OR "receiverId" = $1;`;
        const sql = `
            select invitations."createdAt" as "createdAt",
                   "senderId",
                   "receiverId",
                case
                     when "senderId" = $1 then toUser."fullName"
                     when "receiverId" = $1 then fromUser."fullName"
                     end as "fullName",
                case
                     when "senderId" = $1 then toUser.id
                     when "receiverId" = $1 then fromUser.id
                     end as "userId",
                case
                     when "senderId" = $1 then toUser.email
                     when "receiverId" = $1 then fromUser.email
                     end as email,
                case
                     when "senderId" = $1 then toUser."avatarUrl"
                     when "receiverId" = $1 then fromUser."avatarUrl"
                     end as "avatarUrl",
                not "senderId" = $1 as "isSender"
            from invitations
                join users fromUser on invitations."senderId" = fromUser.id
                join users toUser on invitations."receiverId" = toUser.id
            where "senderId" = $1 OR "receiverId" = $1;
        `;
        const params = [id];

        const result = await db.query(sql, params);
        return result.rows;
    },
    createInvitation: async (senderId: number, receiverId: number) => {
        const params = [senderId, receiverId];
        const sqlPrecheckInvitation = `
            select * from invitations 
                     where ("senderId" = $1 and "receiverId" = $2) or ("senderId" = $2 and "receiverId" = $1) limit 1;`;
        const {rows: existed} = await db.query(sqlPrecheckInvitation, params);

        if (!Helpers.isNullOrEmpty(existed[0])) {
            if (senderId === existed[0].senderId) {
                throw Error("Lời mời kết bạn gửi trùng lặp");
            } else{
                // TODO: will both user send same invitation to other, then if it existed then ok they are friend??
                throw Error("Lời mời kết bạn đã tồn tại");
            }
        }

        const sql = `insert into invitations("senderId", "receiverId") values ($1, $2)`;
        await db.query(sql ,params);

        const sqlSelectNew = `
            select "senderId", "receiverId", invitations."createdAt" as "createdAt",
                   fromUser."fullName" as "senderFullname", fromUser.email as "senderEmail", fromUser."avatarUrl" as "senderAvatarurl",
                   toUser."fullName" as "receiverFullname", toUser.email as "receiverEmail", toUser."avatarUrl" as "receiverAvatarurl"
            from invitations
                join users fromUser on invitations."senderId" = fromUser.id
                join users toUser on invitations."receiverId" = toUser.id
            where "senderId" = $1 OR "receiverId" = $2;`;
        const result = await db.query(sqlSelectNew, params);

        return result.rows[0];
    },
    isBothAreFriends: async (senderId: number, receiverId: number) => {
       const sql = `
            select * from friends where ("userId1" = $1 and "userId2" = $2) or ("userId2" = $1 and "userId1" = $2) `;
        const params = [senderId, receiverId];
        const result = await db.query(sql, params);
        return result.rows[0];
    }
};
