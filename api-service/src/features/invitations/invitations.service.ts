import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = {
    getAllByUserId: async (id: string) => {
        const sql = `
            select "senderId", "receiverId", invitations."createdAt" as "createdAt",
                   fromUser."fullName" as "senderFullname", fromUser.email as "senderEmail", fromUser."avatarUrl",
                   toUser."fullName" as "receiverFullname", toUser.email as "receiverEmail", toUser."avatarUrl"
            from invitations
                join users fromUser on invitations."senderId" = fromUser.id
                join users toUser on invitations."receiverId" = toUser.id
            where "senderId" = $1 OR "receiverId" = $1;`;
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
            throw Error("Lời mời kết bạn đã tồn tại");
        }

        const sql = `insert into invitations("senderId", "receiverId") values ($1, $2)`;
        await db.query(sql ,params);

        const sqlSelectNew = `
            select "senderId", "receiverId", invitations."createdAt" as "createdAt",
                   fromUser."fullName" as "senderFullname", fromUser.email as "senderEmail", fromUser."avatarUrl",
                   toUser."fullName" as "receiverFullname", toUser.email as "receiverEmail", toUser."avatarUrl"
            from invitations
                join users fromUser on invitations."senderId" = fromUser.id
                join users toUser on invitations."receiverId" = toUser.id
            where "senderId" = $1 OR "receiverId" = $2;`;
        const result = await db.query(sqlSelectNew, params);

        return result.rows[0];
    }
};
