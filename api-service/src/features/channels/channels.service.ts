export {}
const db = require("../../repository");
const client = require("../../repository/cassandra");
const Helpers = require("../../common/helpers");

const getAll = async (args?: { channelTypeId?: number }) => {
    const params = [];
    let sql = `with channelWithType as (
    select distinct channels.id,
           "channelTypeId",
           channelTypes.name                              as "channelTypeName",
           channels.status,
           ceil(extract(epoch from channels."createdAt"))::int as "createdAt"
    from channels
             join channelTypes on channelTypes.id = channels."channelTypeId"
), channelMembersInfo as (
    select c.*, jsonb_agg(json_build_object(
        'id', users.id,
        'fullName', users."fullName",
        'email', users."email",
        'phoneNumber', users."phoneNumber",
        'birthday', users."birthday",
        'gender', users."gender",
        'avatarUrl', users."avatarUrl",
        'status', users."status",
        'onlineStatus', users."onlineStatus",
        'lastOnlineTime', users."lastOnlineTime"
        )) as members from channelMembers
                join users on users.id = channelMembers."memberId"
                join channelWithType c on c."id" = channelMembers."channelId" and channelMembers.status = 1
                where channelMembers.status = 1 group by c.id, c."channelTypeId", c."channelTypeName", c.status, c."createdAt"
) select * from channelMembersInfo
    `;
    if (args?.channelTypeId) {
        params.push(args?.channelTypeId);
        sql += `where channels."channelTypeId" = $${params.length}`;
    }
    const result = await db.query(sql, params);

    return await (Promise.all(result.rows.map(async (channel: any) => {
        channel.lastMessage = (await client.execute(`select * from messagesByChannels where "channelId" = ? and status = 1 limit 1;`, [ channel.id ], {prepare: true})).rows[0] || null;
        return channel;
    })));
}

// const getAllByUserId = async (args?: {id: number, channelTypeId?: number, searchText?: string, pageSize?: number}) => {
//     const {id, channelTypeId, searchText = "", pageSize} = args || {};
//     const params: any = [id];
//     let sql = `with channelWithType as (
//     select channels.id,
//            "channelTypeId" as "typeId",
//            channelTypes.name                              as "typeName",
//            channels.status,
//            ceil(extract(epoch from channels."createdAt"))::int as "createdAt"
//     from channels
//              join channelTypes on channelTypes.id = channels."channelTypeId"
//              join channelMembers on channelMembers."channelId" = channels.id and channelMembers."memberId" = $1
//              where channels.status = 1
//     ), channelMembersInfo as (
//     select c.*, jsonb_agg(json_build_object(
//         'id', users.id,
//         'fullName', users."fullName",
//         'email', users."email",
//         'phoneNumber', users."phoneNumber",
//         'birthday', ceil(extract(epoch from users."birthday"))::int,
//         'gender', users."gender",
//         'avatarUrl', users."avatarUrl",
//         'status', users."status",
//         'onlineStatus', users."onlineStatus",
//         'lastOnlineTime', users."lastOnlineTime",
//
//         'lastOnlineTime', users."lastOnlineTime",
//         'lastOnlineTime', users."lastOnlineTime",
//
//          'invitersFullName', inviters."fullName",
//          'invitersAvatarUrl', inviters."avatarUrl"
//         )) as "placeholderMembers" from channelMembers
//                 join users on users.id = channelMembers."memberId"
//                 left join users inviters on channelMembers."invitedBy" = inviters."id"
//                 join channelWithType c on c."id" = channelMembers."channelId" and channelMembers.status = 1
//                 where channelMembers.status = 1 group by c.id, c."typeId", c."typeName", c.status, c."createdAt" limit 4
// ) select * from channelMembersInfo
//     `;
//     if (channelTypeId) {
//         params.push(channelTypeId);
//         sql += ` where channelMembersInfo."typeId" = $${params.length}`;
//     }
//     const result = await db.query(sql, params);
//
//     return await (Promise.all(result.rows.map(async (channel: any) => {
//         channel.lastMessage = (await client.execute(`select * from messagesByChannels where "channelId" = ? and status = 1 limit 1;`, [ channel.id ], {prepare: true})).rows[0] || null;
//         if (channel.typeId === 1) {
//             //    TODO: get channel members (2 members)
//             channel.createdBy = null;
//             if (channel.placeholderMembers[0].id === id) {
//                 channel.channelAvatarUrl = channel.placeholderMembers[1].avatarUrl;
//                 channel.channelName = channel.placeholderMembers[1].fullName;
//                 channel.userId = channel.placeholderMembers[1].id;
//             } else {
//                 channel.channelAvatarUrl = channel.placeholderMembers[0].avatarUrl;
//                 channel.channelName = channel.placeholderMembers[0].fullName;
//                 channel.userId = channel.placeholderMembers[0].id;
//             }
//
//             // Group channel case
//         } else if (channel.typeId === 2) {
//             //    TODO: get channel info by other table
//             const channelInfoSql = `select *
//                                     from groupchannelinfo
//                                     where "channelId" = $1
//                                     limit 1`;
//             const channelInfoResult = await db.query(channelInfoSql, [channel.id]);
//             if (channelInfoResult.rows[0]) {
//                 channel.channelAvatarUrl = channelInfoResult.rows[0].channelAvatarUrl;
//                 channel.channelName = channelInfoResult.rows[0].channelName;
//                 channel.channelHostId = channelInfoResult.rows[0].channelHostId;
//                 channel.userId = null;
//                 channel.createdBy = channelInfoResult.rows[0].createdBy;
//             } else {
//                 channel.channelAvatarUrl = null;
//                 channel.channelName = null;
//                 channel.channelHostId = null;
//                 channel.userId = null;
//                 channel.createdBy = null;
//             }
//
//             //    Developing channel case
//         } else {
//             channel.channelAvatarUrl = "developing-channel-avatar-url";
//             channel.channelName = "developing-channel-name";
//         }
//         return channel;
//     })));
// }
const getAllByUserId = async (args?: {id: number, channelTypeId?: number, searchText?: string, pageSize?: number, channelId?: number}) => {
    const {id, channelTypeId, searchText = "", pageSize, channelId} = args || {};
    const params: any = [id];
    let sql = `with channelWithType as (
    select distinct channels.id,
           "channelTypeId" as "typeId",
           channelTypes.name                              as "typeName",
           channels.status,
           ceil(extract(epoch from channels."createdAt"))::int as "createdAt"
    from channels
             join channelTypes on channelTypes.id = channels."channelTypeId"
             join channelMembers on channelMembers."channelId" = channels.id and channelMembers."memberId" = $1
             where channels.status = 1
    ),
     friendChannel as (
    select cWt.*,
           case
               when "userId1" = $1 then user2.id
               when "userId2" = $1 then user1.id
               end as "createdBy",
       case
           when "userId1" = $1 then user2."avatarUrl"
           when "userId2" = $1 then user1."avatarUrl"
           end as "channelAvatarUrl",
       case
           when "userId1" = $1 then user2."fullName"
           when "userId2" = $1 then user1."fullName"
           end as "channelName",
        null::int "channelHostId"
from friends
         join users user1 on user1.id = friends."userId1"
         join users user2 on user2.id = friends."userId2"
         join channelMembers cM1 on user1.id = cM1."memberId"
         join channelMembers cM2 on user2."id" = cM2."memberId" and cM1."channelId" = cM2."channelId"
         join channelWithType cwt on cwt.id = cM1."channelId"
where  friends.status = 1 and "typeId" = 1
  and ("userId1" = $1 or "userId2" = $1) ),
    groupChannel as ( select
                            t.*,
                          "createdBy",
                          groupChannelInfo."channelAvatarUrl",
                          groupChannelInfo."channelName",
                          groupChannelInfo."channelHostId"
                          from channelWithType t join groupChannelInfo on id = groupChannelInfo."channelId" where t."typeId" = 2),
    channelIds as (select * from friendChannel union all select * from groupChannel),
    channelMembersInfo as (
    select c.id, jsonb_agg(json_build_object(
        'id', users.id,
        'fullName', users."fullName",
        'email', users."email",
        'phoneNumber', users."phoneNumber",
        'birthday', ceil(extract(epoch from users."birthday"))::int,
        'gender', users."gender",
        'avatarUrl', users."avatarUrl",
        'status', users."status",
        'onlineStatus', users."onlineStatus",

         'invitersFullName', inviters."fullName",
         'invitersAvatarUrl', inviters."avatarUrl"
        )) as "placeholderMembers" from channelMembers
                join users on users.id = channelMembers."memberId"
                left join users inviters on channelMembers."invitedBy" = inviters."id"
                join channelIds c on c."id" = channelMembers."channelId" and channelMembers.status = 1
                where channelMembers.status = 1 group by c.id limit 4
) select c.*, cMI."placeholderMembers" from channelMembersInfo cMI join channelIds c on c.id = cMI.id
    `;
    params.push(`%${searchText}%`);
    sql += ` where lower("channelName") LIKE lower($${params.length})`;
    if (channelId) {
        params.push(channelId);
        sql += ` and c.id = $${params.length}`;
    }
    if (channelTypeId) {
        params.push(channelTypeId);
        sql += ` and c."typeId" = $${params.length}`;
    }
    const result = await db.query(sql, params);
    return (await (Promise.all(result.rows.map(async (channel: any) => {
        const message = (await client.execute(`select
                                                         "channelId", id,
                                                         cast(toUnixTimestamp("createdAt") as bigint) / 1000 as "createdAt",
                                                         "messageTypeId",
                                                         "message",
                                                         "createdBy",
                                                         status,
                                                         "replyForId"
    from messagesByChannels where "channelId" = ? and status = 1 limit 1;`, [ channel.id ], {prepare: true})).rows[0] || null
        if (message !== null) {
            channel.lastMessage = {...message, createdAt: message.createdAt.low};
        } else {
            channel.lastMessage = null;
        }
        return channel;
    })))).filter(c => c.lastMessage !== null);
}
const removeUserToTypingList = async ({channelId, typingId}) => {
    const getSql = `select *
                        from typing
                        where "channelId" = ?`;
    const oldTypingResult = await client.execute(getSql, [channelId], {prepare: true});
    // Not created case so may be null
    const typing = oldTypingResult.rows[0] || {};
    const typingSet = new Set(JSON.parse(typing.typingUsersId || "[]"));
    typingSet.delete(typingId);
    const typingList = Array.from(typingSet);

    const queries = [{
        query: `update typing set "typingUsersId" = ? where "channelId" = ?;`,
        params: [JSON.stringify(typingList), channelId],
    }, {
        query: `delete from userTypingChannel where "userId" = ?;`,
        params: [typingId]
    }];
    await client.batch(queries, {prepare: true});

    return {
        typingList,
        channelId,
    };
};

const getChannelById = async (args?: {id: number, channelId: number}) => {
    const {id, channelId} = args || {};
    const params: any = [id, channelId];
    let sql = `with channelWithType as (
    select distinct channels.id,
           "channelTypeId" as "typeId",
           channelTypes.name                              as "typeName",
           channels.status,
           ceil(extract(epoch from channels."createdAt"))::int as "createdAt"
    from channels
             join channelTypes on channelTypes.id = channels."channelTypeId"
             join channelMembers on channelMembers."channelId" = channels.id
             where channels.status = 1 and channels.id = $2
    ),
     friendChannel as (
    select cWt.*,
           case
               when "userId1" = $1 then user2.id
               when "userId2" = $1 then user1.id
               end as "createdBy",
       case
           when "userId1" = $1 then user2."avatarUrl"
           when "userId2" = $1 then user1."avatarUrl"
           end as "channelAvatarUrl",
       case
           when "userId1" = $1 then user2."fullName"
           when "userId2" = $1 then user1."fullName"
           end as "channelName",
        null::int "channelHostId"
from friends
         join users user1 on user1.id = friends."userId1"
         join users user2 on user2.id = friends."userId2"
         join channelMembers cM1 on user1.id = cM1."memberId"
         join channelMembers cM2 on user2."id" = cM2."memberId" and cM1."channelId" = cM2."channelId"
         join channelWithType cwt on cwt.id = cM1."channelId"
where  friends.status = 1 and "typeId" = 1
  and ("userId1" = $1 or "userId2" = $1) ),
    groupChannel as ( select
                            t.*,
                          "createdBy",
                          groupChannelInfo."channelAvatarUrl",
                          groupChannelInfo."channelName",
                          groupChannelInfo."channelHostId"
                          from channelWithType t join groupChannelInfo on id = groupChannelInfo."channelId" where t."typeId" = 2),
    channelIds as (select * from friendChannel union all select * from groupChannel),
    channelMembersInfo as (
    select c.id, jsonb_agg(json_build_object(
        'id', users.id,
        'fullName', users."fullName",
        'email', users."email",
        'phoneNumber', users."phoneNumber",
        'birthday', ceil(extract(epoch from users."birthday"))::int,
        'gender', users."gender",
        'avatarUrl', users."avatarUrl",
        'status', users."status",
        'onlineStatus', users."onlineStatus",

         'invitersFullName', inviters."fullName",
         'invitersAvatarUrl', inviters."avatarUrl",
         
        'isReceivedMessageSeen', channelMembers."isSeen",
        'lastMessageReceivedId', channelMembers."lastMessageReceivedId"
    )) as members from channelMembers
                join users on users.id = channelMembers."memberId"
                left join users inviters on channelMembers."invitedBy" = inviters."id"
                join channelIds c on c."id" = channelMembers."channelId" and channelMembers.status = 1
                where channelMembers.status = 1 group by c.id
) select c.*, cMI.members from channelMembersInfo cMI join channelIds c on c.id = cMI.id
    `;
    const result = await db.query(sql, params);
    return (await (Promise.all(result.rows.map(async (channel: any) => {
        const messages = (await client.execute(`select
                                                         id,
                                                         cast(toUnixTimestamp("createdAt") as bigint) / 1000 as "createdAt",
                                                         "messageTypeId",
                                                         "message",
                                                         "createdBy",
                                                         status,
                                                         "replyForId"
    from messagesByChannels where "channelId" = ? and status = 1;`, [ channel.id ], {prepare: true})).rows.map(r => ({...r, createdAt: r.createdAt.low})) || null
        channel.messages = messages.sort((a, b) => a.id - b.id);
        return channel;
    })))).filter(c => c.lastMessage !== null)[0];
}
module.exports = {
    getAll,
    removeUserToTypingList,
    getChannelById,
    getByChannelId: async (id: string) => {
        const sql = `
            select channels.id, "channelTypeId", channelTypes.name as "channelTypeName", channels.status,
                   ceil(extract(epoch from channels."createdAt"))::int as "createdAt"
            from channels join channelTypes on channelTypes.id = channels."channelTypeId" where channels.id = $1
        `;
        const result = await db.query(sql, [id]);

        return await (Promise.all(result.rows.map(async (channel: any) => {
           const membersSql = `select
               distinct
               users.id,
               users."fullName",
               users."registerTypeId",
               users.email,
               users."avatarUrl",
               ceil(extract(epoch from users."birthday"))::int as "birthday",
               users."gender",
               users."phoneNumber",
               users."status",
               users."onlineStatus",
               users."lastOnlineTime",
               ceil(extract(epoch from "joinAt"))::int as "joinAt"
           from channelmembers
               join users on users.id = channelmembers."memberId" where channelMembers.status = 1 and "channelId" = $1;`;
           channel.members = (await db.query(membersSql, [channel.id])).rows;
           return channel;
        })));
    },
    getAllByUserId,
    getAllChannelMembersByChannelId: async (id: string) => {
        const params = [id];
        const membersSql = `select
               distinct
               users.id,
               users."fullName",
               users."registerTypeId",
               users.email,
               users."avatarUrl",
               users."birthday",
               users."gender",
               users."phoneNumber",
               users."status",
               users."onlineStatus",
               users."lastOnlineTime",
               ceil(extract(epoch from "joinAt"))::int as "joinAt"
           from channelmembers
               join users on users.id = channelmembers."memberId" where channelMembers.status = 1 and "channelId" = $1;`;

        const result = await db.query(membersSql, params);
        return result.rows;
    },
    searchChannels: async ({ userId, searchText, pageSize, channelId }) => {
        return await getAllByUserId({
            searchText,
            pageSize,
            id: userId,
            channelId,
        });
    },
    getAllFriendChannels: async (id: number) => {
        return await getAllByUserId({
            channelTypeId: 1,
            id,
        });
    },
    getAllGroupChannels: async (id: number) => {
        return await getAllByUserId({
            channelTypeId: 2,
            id,
        });
    },
    getAllMembersIdByChannelId: async (channelId: number, senderId: any) => {
        const precheckUserinChannelSql =  ``;
        const sql = `with "channelInfomation" as (
            select * from channels where id = $1 and status = 1 limit 1
        ), "membersId" as (
          select json_agg("memberId") as "membersId" from channels join channelMembers cM on channels.id = cM."channelId" where channels.id = $1
        ) select * from "channelInfomation", "membersId";`;

        const result = await db.query(sql, [channelId]);
        return result.rows[0];
    },
    addUserToTypingList: async ({channelId, typingId}) => {
        const getSql = `select *
                        from typing
                        where "channelId" = ?`;
        const oldTypingResult = await client.execute(getSql, [channelId], {prepare: true});
        // Not created case so may be null
        const typing = oldTypingResult.rows[0] || {};
        const typingSet = new Set(JSON.parse(typing.typingUsersId || "[]"));
        typingSet.add(typingId);
        const typingList = Array.from(typingSet);

        const queries = [{
            query: `update typing set "typingUsersId"=? where "channelId" = ?;`,
            params: [JSON.stringify(typingList), channelId],
        }, {
            query: `update userTypingChannel set "channelId" = ? where "userId" = ? ;`,
            params: [channelId, typingId]
        }];
        await client.batch(queries, {prepare: true});

        return {
            typingList,
            channelId,
        };
    },
    getTypingListByChannelId: async ({ channelId }) => {
        const sql = `select * from typing where "channelId" = ?`;
       const result = await client.execute(sql, [channelId], { prepare: true });
       if (Helpers.isNullOrEmpty(result.rows[0])) {
            return {
                channelId,
                typingUsersId: [],
            }
       }
       return {
           channelId,
           typingUsersId: JSON.parse(result.rows[0].typingUsersId),
       };
    },
    unTyping: async ({typingId}) => {
        // Get channel that user is typing
        const getSql = `select * from userTypingChannel where "userId" = ?`;
        const params = [typingId];
        const getSqlResult = await client.execute(getSql, params, { prepare: true });
        const row = getSqlResult.rows[0];
        if (!row) {
            return {
                channelId: -1,
                typingUsersId: [],
            };
        }

        return removeUserToTypingList({ channelId: row.channelId, typingId })
    },
    //TODO: Get bulk of user's information by user's id

    getImageMessages: async ({ channelId }) => {
        const result = await client.execute(`select * from messagesbychannels where "channelId" = ? and "messageTypeId" = 2`, [channelId], { prepare: true });
        return result.rows;
    },
    getFileMessages: async ({ channelId }) => {
        const result = await client.execute(`select * from messagesbychannels where "channelId" = ? and "messageTypeId" = 3`, [channelId], { prepare: true });
        return result.rows;
    },
    getVideoMessages: async ({ channelId }) => {
        const result = await client.execute(`select * from messagesbychannels where "channelId" = ? and "messageTypeId" = 4`, [channelId], { prepare: true });
        return result.rows;
    },
};