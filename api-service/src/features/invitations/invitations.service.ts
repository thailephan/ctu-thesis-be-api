import {ICondition, IQueryParams} from "../../common/interface";
import {add} from "winston";

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
            select ceil(extract(epoch from invitations."createdAt"))::int as "createdAt",
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
            select "senderId", "receiverId",
                   fromUser."fullName" as "senderFullname", fromUser.email as "senderEmail", fromUser."avatarUrl" as "senderAvatarurl",
                   toUser."fullName" as "receiverFullname", toUser.email as "receiverEmail", toUser."avatarUrl" as "receiverAvatarurl"
                    , ceil(extract(epoch from invitations."createdAt"))::int as "createdAt" 
            from invitations
                join users fromUser on invitations."senderId" = fromUser.id
                join users toUser on invitations."receiverId" = toUser.id
            where "senderId" = $1 OR "receiverId" = $2;`;
        const result = await db.query(sqlSelectNew, params);

        return result.rows[0];
    },
    isBothAreFriends: async (senderId: number, receiverId: number) => {
       const sql = `select * from friends where status = 1 and (("userId1" = $1 and "userId2" = $2) or ("userId2" = $1 and "userId1" = $2)) order by "createdAt" desc limit 1;`;
        const params = [senderId, receiverId];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
    deleteInvitation: async (senderId: number, receiverId: number) => {
        const params = [senderId, receiverId];
        const sqlPrecheckInvitation = `select * from invitations where ("senderId" = $1 and "receiverId" = $2) or ("senderId" = $2 and "receiverId" = $1) limit 1;`;
        const {rows: existed} = await db.query(sqlPrecheckInvitation, params);
        debug.db("invitation:deleteInvitation", {
            query: sqlPrecheckInvitation,
            params,
            rows: existed,
        });
        if (Helpers.isNullOrEmpty(existed[0])) {
            throw Error("Lời mời kết bạn không còn tồn tại");
        } else {
            const sql = `delete from invitations
                where ("senderId" = $1 and "receiverId" = $2) or ("senderId" = $2 and "receiverId" = $1);`
            const result = await db.query(sql, params);

            debug.db("invitation:deleteInvitation", {
                rows: result.rows,
            });
            return result.rows[0];
        }
    },
    addFriend : async (senderId: number, receiverId: number) => {
        const params = [senderId, receiverId];
        const sqlPrecheckInvitation = `
            select * from invitations 
                     where ("senderId" = $1 and "receiverId" = $2) or ("senderId" = $2 and "receiverId" = $1) limit 1;`;
        const {rows: existed} = await db.query(sqlPrecheckInvitation, params);

        if (Helpers.isNullOrEmpty(existed[0])) {
            throw Error("Lời mời kết bạn không còn tồn tại");
        } else {
            const client = await db.getClient();

            try {
                await client.query('BEGIN;');
                const deleteInvitationSql = `delete from invitations where ("senderId" = $1 and "receiverId" = $2) or ("senderId" = $2 and "receiverId" = $1);`
                const addFriendSql = `insert into friends("userId1", "userId2") values ($1, $2);`;

                await client.query(deleteInvitationSql, params);
                await client.query(addFriendSql, params);
                debug.db("invitation:addFriend", {
                    invitation: deleteInvitationSql,
                    friend: addFriendSql
                });

                const createChannel = `insert into channels("channelTypeId") values ($1) returning *`;
                const createChannelParams = [1];
                const createChannelResult = await db.query(createChannel, createChannelParams);
                const channel = createChannelResult.rows[0];

                const addMember = `insert into channelmembers("channelId", "memberId") values ($1, $2);`
                // const addMember2Params = [channel.id, receiverId];
                await db.query(addMember, [channel.id, senderId]);
                await db.query(addMember, [channel.id, receiverId]);
                // await db.query(createChannel, createChannelParams);

                await client.query('END;');
                await client.query('COMMIT');

                return channel;
            } catch (e) {
                await client.query('ROLLBACK')
                throw e
            } finally {
                client.release()
            }
        }

        return null;
    },
    getAllSentByUserId: async ({id}) => {
        const sql = `select "receiverId",
                            "fullName",
                            "avatarUrl",
                            email,
                            ceil(extract(epoch from invitations."createdAt"))::int as "createdAt"
                     from invitations join users
                     on invitations."receiverId" = users.id
                     where "senderId" = $1`;
        const params = [id];
        console.log(id);
        const result = await db.query(sql, params);
        return result.rows;
    },
    getAllReceivedByUserId: async ({id}) => {
        const sql = `select "senderId",
                            "fullName",
                            "avatarUrl",
                            email,
                            ceil(extract(epoch from invitations."createdAt"))::int as "createdAt"
                     from invitations join users
                     on invitations."senderId" = users.id
                     where "receiverId" = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows;
    }
};
