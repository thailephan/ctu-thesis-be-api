export {}
const db = require("../../repository");
const client = require("../../repository/cassandra");
const debug = require("../../common/debugger");

// GetAll v1
// const getAll = async (args?: { channelTypeId?: number }) => {
//     const params = [];
//     let sql = `
//         select channels.id,
//                "channelTypeId",
//                channelTypes.name                              as "channelTypeName",
//                channels.status,
//                ceil(extract(epoch from channels."createdAt")) as "createdAt",
//                array_to_json(ARRAY(select distinct users.id,
//                                             users."fullName",
//                                             users."registerTypeId",
//                                             users.email,
//                                             users."avatarUrl",
//                                             users."birthday",
//                                             users."gender",
//                                             users."phoneNumber",
//                                             users."status",
//                                             users."onlineStatus",
//                                             users."lastOnlineTime",
//                                             ceil(extract(epoch from "joinAt")) as "joinAt"
//                    from channelMembers join users on channelMembers."memberId" = users.id where channelMembers.status = 1 and "channelId" = 1)) as mem1ber
//         from channels
//         join channelTypes on channelTypes.id = channels."channelTypeId"
//     `;
//     if (args?.channelTypeId) {
//         params.push(args?.channelTypeId);
//         sql += `where channels."channelTypeId" = $${params.length}`;
//     }
//     const result = await db.query(sql, params);
//
//     return await (Promise.all(result.rows.map(async (channel: any) => {
//         channel.lastMessage = (await client.execute(`select * from messagesByChannels where "channelId" = ? and status = 1 order by id desc limit 1;`, [ channel.id ], {prepare: true})).rows[0] || null;
//         const membersSql = `select distinct users.id,
//                                             users."fullName",
//                                             users."registerTypeId",
//                                             users.email,
//                                             users."avatarUrl",
//                                             users."birthday",
//                                             users."gender",
//                                             users."phoneNumber",
//                                             users."status",
//                                             users."onlineStatus",
//                                             users."lastOnlineTime",
//                                             ceil(extract(epoch from "joinAt")) as "joinAt"
//                             from channelmembers join users
//                             on users.id = channelmembers."memberId"
//                             where channelMembers.status = 1 and "channelId" = $1;`;
//         channel.members = (await db.query(membersSql, [channel.id])).rows;
//         return channel;
//     })));
// }
const getAll = async (args?: { channelTypeId?: number }) => {
    const params = [];
    let sql = `with channelWithType as (
    select channels.id,
           "channelTypeId",
           channelTypes.name                              as "channelTypeName",
           channels.status,
           ceil(extract(epoch from channels."createdAt")) as "createdAt"
    from channels
             join channelTypes on channelTypes.id = channels."channelTypeId"
), channelMembersInfo as (
    select c.*, jsonb_agg(json_build_object(
        'id', users.id,
        'fullName', users."fullName",
        'email', users."email",
        'phoneNumber"', users."phoneNumber",
        'birthday"', users."birthday",
        'gender"', users."gender",
        'avatarUrl"', users."avatarUrl",
        'status"', users."status",
        'onlineStatus"', users."onlineStatus",
        'lastOnlineTime"', users."lastOnlineTime"
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
        channel.lastMessage = (await client.execute(`select * from messagesByChannels where "channelId" = ? and status = 1 order by id desc limit 1;`, [ channel.id ], {prepare: true})).rows[0] || null;
        return channel;
    })));
}
// getAllByUserId old
// const getAllByUserId = async (args?: {id: number, channelTypeId?: number}) => {
//     const {id, channelTypeId} = args || {};
//     const params = [id];
//     let userChannelsSql = `select channels.id,
//                                     "channelTypeId"                                as "typeId",
//                                     channelTypes.name                              as "typeName",
//                                     ceil(extract(epoch from channels."createdAt")) as "createdAt"
//                              from channels join channelMembers
//                              on channelMembers."channelId" = channels.id
//                                  join channelTypes on channelTypes.id = channels."channelTypeId"
//                              where "memberId" = $1 and channelMembers.status >= 1
//     `;
//     if (channelTypeId) {
//         params.push(channelTypeId);
//         userChannelsSql += ` and channels."channelTypeId" = $${params.length}`
//     }
//     const {rows: userChannels} = await db.query(userChannelsSql, params);
//     return (await Promise.all(userChannels.map(async (channel) => {
//         //    TODO: get channel members
//         const channelMembersSql = `select distinct users.id,
//                                                    users."fullName",
//                                                    users."registerTypeId",
//                                                    users.email,
//                                                    users."avatarUrl",
//                                                    users."birthday",
//                                                    users."gender",
//                                                    users."phoneNumber",
//                                                    users."status",
//                                                    users."onlineStatus",
//                                                    users."lastOnlineTime",
//                                                    ceil(extract(epoch from channelMembers."joinAt")) as "joinAt",
//
//                                                    channelMembers."invitedBy",
//                                                    userInvite."fullName"                             as "userInviteFullName"
//                                    from channelmembers join users
//                                    on users.id = channelmembers."memberId"
//                                        left join users userInvite on userInvite.id = channelMembers."invitedBy"
//                                    where channelMembers.status = 1 and "channelId" = $1
//                                    limit 4;`
//         const channelMembersResult = await db.query(channelMembersSql, [channel.id]);
//         channel.placeholderMembers = channelMembersResult.rows;
//
//         // Friend channel case
//         if (channel.typeId === 1) {
//             //    TODO: get channel members (2 members)
//             channel.createdBy = null;
//             if (channelMembersResult.rows[0].id === id) {
//                 channel.channelAvatarUrl = channelMembersResult.rows[1].avatarUrl;
//                 channel.channelName = channelMembersResult.rows[1].fullName;
//             } else {
//                 channel.channelAvatarUrl = channelMembersResult.rows[0].avatarUrl;
//                 channel.channelName = channelMembersResult.rows[0].fullName;
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
//                 channel.createdBy = channelInfoResult.rows[0].createdBy;
//             } else {
//                 channel.channelAvatarUrl = null;
//                 channel.channelName = null;
//                 channel.channelHostId = null;
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

const getAllByUserId = async (args?: {id: number, channelTypeId?: number}) => {
    const {id, channelTypeId} = args || {};
    const params = [id];
    let sql = `with channelWithType as (
    select channels.id,
           "channelTypeId" as "typeId",
           channelTypes.name                              as "typeName",
           channels.status,
           ceil(extract(epoch from channels."createdAt")) as "createdAt"
    from channels
             join channelTypes on channelTypes.id = channels."channelTypeId"
             join channelMembers on channelMembers."channelId" = channels.id and channelMembers."memberId" = $1
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
        'lastOnlineTime', users."lastOnlineTime",

        'lastOnlineTime', users."lastOnlineTime",
        'lastOnlineTime', users."lastOnlineTime",

         'invitersFullName', inviters."fullName",
         'invitersAvatarUrl', inviters."avatarUrl"
        )) as "placeholderMembers" from channelMembers
                join users on users.id = channelMembers."memberId"
                left join users inviters on channelMembers."invitedBy" = inviters."id"
                join channelWithType c on c."id" = channelMembers."channelId" and channelMembers.status = 1
                where channelMembers.status = 1 group by c.id, c."typeId", c."typeName", c.status, c."createdAt" limit 4
) select * from channelMembersInfo
    `;
    if (channelTypeId) {
        params.push(channelTypeId);
        sql += ` where channels."typeId" = $${params.length}`;
    }
    const result = await db.query(sql, params);

    return await (Promise.all(result.rows.map(async (channel: any) => {
        if (channel.typeId === 1) {
            //    TODO: get channel members (2 members)
            channel.createdBy = null;
            if (channel.placeholderMembers[0].id === id) {
                channel.channelAvatarUrl = channel.placeholderMembers[1].avatarUrl;
                channel.channelName = channel.placeholderMembers[1].fullName;
            } else {
                channel.channelAvatarUrl = channel.placeholderMembers[0].avatarUrl;
                channel.channelName = channel.placeholderMembers[0].fullName;
            }

            // Group channel case
        } else if (channel.typeId === 2) {
            //    TODO: get channel info by other table
            const channelInfoSql = `select *
                                    from groupchannelinfo
                                    where "channelId" = $1
                                    limit 1`;
            const channelInfoResult = await db.query(channelInfoSql, [channel.id]);
            if (channelInfoResult.rows[0]) {
                channel.channelAvatarUrl = channelInfoResult.rows[0].channelAvatarUrl;
                channel.channelName = channelInfoResult.rows[0].channelName;
                channel.channelHostId = channelInfoResult.rows[0].channelHostId;
                channel.createdBy = channelInfoResult.rows[0].createdBy;
            } else {
                channel.channelAvatarUrl = null;
                channel.channelName = null;
                channel.channelHostId = null;
                channel.createdBy = null;
            }

            //    Developing channel case
        } else {
            channel.channelAvatarUrl = "developing-channel-avatar-url";
            channel.channelName = "developing-channel-name";
        }
        return channel;
    })));
}
module.exports = {
    getAll,
    getByChannelId: async (id: string) => {
        const sql = `
            select channels.id, "channelTypeId", channelTypes.name as "channelTypeName", channels.status,
                   ceil(extract(epoch from channels."createdAt")) as "createdAt"
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
               users."birthday",
               users."gender",
               users."phoneNumber",
               users."status",
               users."onlineStatus",
               users."lastOnlineTime",
               ceil(extract(epoch from "joinAt")) as "joinAt"
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
               ceil(extract(epoch from "joinAt")) as "joinAt"
           from channelmembers
               join users on users.id = channelmembers."memberId" where channelMembers.status = 1 and "channelId" = $1;`;

        const result = await db.query(membersSql, params);
        return result.rows;
    },
    getAllFriendChannels: async (id: number) => {
        return await getAllByUserId({
            channelTypeId: 1,
            id,
        })
    },
};