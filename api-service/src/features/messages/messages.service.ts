import {IMessageQueryParams} from "../../common/interface";

const db = require("../../repository");
const client = require("../../repository/cassandra");

const updateMessageSeen = async ({ channelId, messageId, userId }) => {
    let lastMessageId = messageId;
    if (lastMessageId === "latest") {
        lastMessageId = (await client.execute(`select max(id) as id from messagesByChannels where "channelId" = ?;`, [channelId], { prepare: true})).rows[0].id;
    }
    await db.query(`
        update channelMembers set "lastMessageReceivedId" = (case when greatest("lastMessageReceivedId", $3) = $3 then $3 else "lastMessageReceivedId"  end),
                                  "isSeen" = (case when greatest("lastMessageReceivedId", $3) = $3 then true else  "isSeen" end) where "memberId" = $1 and "channelId" = $2`, [userId, channelId, lastMessageId]);
    return { messageId: lastMessageId, };
}

// const updateAllMessageRead = async ({ messageId, userId }) => {
//     let lastMessageId = messageId;
//     if (lastMessageId === "latest") {
//         lastMessageId = (await client.execute(`select max(id) as id from messagesByChannels where "channelId" = ?;`, [channelId], { prepare: true}));
//     }
//     await db.query(`update channelMembers set "lastMessageReceivedId" = greatest("lastMessageReceivedId", $3), "isSeen" = true where "memberId" = $1 and "channelId" = $2`, [userId, channelId, lastMessageId])
//     return true;
// }
module.exports = {
    getAll: async ({ channelId, userId }: IMessageQueryParams) => {
        const result = await client.execute(`select id, message, "channelId", "messageTypeId", status, "createdBy", "replyForId", tounixtimestamp("createdAt") / 1000 as "createdAt" from messagesByChannels where "channelId" = ?`, [channelId], {prepare: true});
        // await updateAllMessageRead({ userId });
        await updateMessageSeen({ channelId, messageId: "lastest", userId });
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
        await db.query(`update channelMembers set "lastMessageReceivedId" = greatest("lastMessageReceivedId", $3), "isSeen" = true where "memberId" = $1 and "channelId" = $2`, [createdBy, channelId, newMessageResult.rows[0].id])
        return newMessageResult.rows[0];
    },
    deleteMessage: async ({messageId, channelId}: {messageId: any, channelId: any}) => {
        const result = await client.execute(`update messagesByChannels set status = -1 where "channelId" = ? and id = ?;`, [channelId, messageId], {prepare: true});
        return result.rows;
    },
    updateMessageReceived: async ({ channelId, messageId, userId }) => {
        let lastMessageId = messageId;
        if (lastMessageId === "latest") {
           lastMessageId = (await client.execute(`select max(id) as id from messagesByChannels where "channelId" = ?;`, [channelId], { prepare: true})).rows[0].id;
        }
        console.log("Message Id", lastMessageId);
        await db.query(`
        update channelMembers set "lastMessageReceivedId" = (case when greatest("lastMessageReceivedId", $3) = $3 then $3 else "lastMessageReceivedId"  end),
                                  "isSeen" = (case when greatest("lastMessageReceivedId", $3) = $3 then false else "isSeen" end) where "memberId" = $1 and "channelId" = $2`, [userId, channelId, lastMessageId]);
        return { messageId: lastMessageId, };

    },
    updateMessageSeen,
};