import {IMessageQueryParams} from "../../common/interface";

const db = require("../../repository");
const client = require("../../repository/cassandra");

module.exports = {
    getAll: async ({ channelId }: IMessageQueryParams) => {
        const result = await client.execute(`select id, message, "channelId", "messageTypeId", status, "createdBy", "replyForId", tounixtimestamp("createdAt") / 1000 as "createdAt" from messagesByChannels where "channelId" = ?`, [channelId], {prepare: true});
        return result.rows;
    },
    createMessage: async ({
                              channelId,
                              messageTypeId,
                              message,
                              replyForId,
                              createdBy
                          }: { channelId: any, messageTypeId: any, message: string, replyForId?: any, createdBy: number }) => {
        const msgIndexResult = await client.execute("select max(id) as id from messagesByChannels");
        const currentMsgId = msgIndexResult.rows[0].get("id") || 0;

        if (replyForId > currentMsgId) {
           throw Error("Phản hồi đến tin nhắn không tồn tại");
        }

        const params = [channelId, currentMsgId + 1, messageTypeId, createdBy, message, replyForId];
        const createNewMessage = await client.execute(`insert into messagesByChannels("channelId", id, "messageTypeId",
                                                                            "createdBy", "message", "createdAt", status,
                                                                            "replyForId")
                                             values (?, ?, ?, ?, ?, toTimestamp(now()), 1, ?)`, params, {
            prepare: true
        });

        const newMessageResult = await client.execute(` select "channelId", id,
                    toUnixTimestamp("createdAt") / 1000 as "createdAt",
                    "messageTypeId",
                    "message",
                    "createdBy",
                    status,
                    "replyForId"
                from messagesbychannels where "channelId" = ? and status = 1 and id = ?`,
            [channelId, currentMsgId + 1], { prepare: true});
        return newMessageResult.rows[0];
    },
    deleteMessage: async ({messageId, channelId}: {messageId: any, channelId: any}) => {
        const result = await client.execute(`update messagesByChannels set status = -1 where "channelId" = ? and id = ?;`, [channelId, messageId], {prepare: true});
        return result.rows;
    },
    createUserReadForMesasge: async ({messageId, channelId, createdBy}: {messageId: any, channelId: any, createdBy: number}) => {
        const result = await db.query(`insert into userreadmessage("channelId", "messageId", "createdBy", "updatedBy", "readUserIds")
                values ($1, $2, $3, $3, $4)`, [channelId, messageId, createdBy, createdBy.toString()]);
        return result.rows;
    },
    updateUserReadMessage: async ({messageId, channelId, senderId}: {messageId: any, channelId: any, senderId: number}) => {
        const newReadUserIds = "";
        const result = await db.query(`update userreadmessage set "readUserIds" = $1 where "messageId" = $2 and "channelId" = $3`,
            [newReadUserIds, messageId, channelId]);
        return null;
    },
};