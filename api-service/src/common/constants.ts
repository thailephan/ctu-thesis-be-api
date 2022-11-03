export const MessageType = new Map<number, string>([[1, "information"], [2, "friend"], [3, "group"]]);
export const RoomType = new Map([[1, 'stranger'], [2, 'friend'], [3, 'group']]);
export const MessageStatus = new Map([[1, 'sent'], [2, 'received'], [3, 'seen'], [-1, 'delete']]);
export const AccountStatus = new Map([[1, 'active'], [2, 'blocked'], [0, 'waiting for verified'], [-1, 'delete']]);
export const AccountRegisterType = new Map([[1, 'email/password'], [2, 'google']]);

// Base SQL query
export const BASE_SQL_USERS = `
    select u.id,
           "fullName",
           "registerTypeId",
           gender,
           u.email,
           "phoneNumber",
           address,
           u.status,
           u."createdAt",
           u."updatedAt",
           u."createdBy",
           u."updatedBy",
           hash,
           "tempHash",
           "avatarUrl",

           "wardId",
           wards.name as "wardName",
           "provinceId",
           provinces.name as "provinceName",
           "districtId",
           districts.name as "districtName",

           "classId",
           classes.name as "className",
           "courseId",
           courses.name as "courseName",
           courses."shortName" as "courseShortName",
           "deparmentId",
           departments.name as "departmentName",
           "collegeId",
           colleges.name as "collegeName"
    from users u
        left join userAccounts uA on u.id = uA."userId"

        left join wards on u."wardId" = wards.id
        left join districts on wards."districtId" = districts.id
        left join provinces on districts."provinceId" = provinces.id

        left join classes on u."classId" = classes.id
        left join courses on classes."courseId" = courses.id
        left join colleges on classes."collegeId" = colleges.id
        left join departments on colleges."deparmentId" = departments.id
`;

export const BASE_SQL_FRIENDS = `
    select "userId1", sender."fullName" as "senderFullName", "userId2", receiver."fullName" as "receiverFullName", ceil(extract(epoch from friends."createdAt")) as "createdAt"
    from friends
        join users sender on sender.id = "userId1"
        left join users receiver on receiver.id = "userId2"
`;

export const BASE_SQL_ROOMS = `
    select
        distinct
        chatRoom.id,
        "typeId",
        "messageTotal",
        chatRoom.status,
        ceil(extract(epoch from chatRoom."createdAt")) as "createdAt",
        ceil(extract(epoch from chatRoom."updatedAt")) as "updatedAt",
        chatRoom."createdBy",
        chatRoom."updatedBy",
        chatRoomType.name as "typeName",

        info.name as "roomName"
    from chatRoom
        left join chatRoomType on chatRoom."typeId" = chatRoomType.id
`;

export const BASE_SQL_MESSAGES  = `
    select "senderId",
           messages."roomId",
           messages."messageId",
           "typeId",
           content,
           "createdAt",
           status,

           "replyForMesasgeId"
    from messages
        left join messageTypes on messages."typeId" = messageTypes.id
        left join messageReplies on messages."messageId" = messageReplies."messageId" and messages."roomId" = messageReplies."roomId"
`