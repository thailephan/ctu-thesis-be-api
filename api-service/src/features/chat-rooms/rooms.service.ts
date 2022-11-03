import {ICondition, IUser, IUserQueryParams} from "../../common/interface";
import {BASE_SQL_USERS} from "../../common/constants";

export {}
const db = require("../../repository");
const debug = require("../../common/debugger");
const { BASE_SQL_ROOMS } = require("../../common/constants");

module.exports = {
    // async count(condition: ICondition) {
    //     const { search } = condition;
    //     try {
    //         let sql = `select count(*) from users`;
    //         if (search) {
    //             sql += ` where status >= 1 and u.name LIKE '%${search}%'`
    //         }
    //         const result = await db.query(sql);
    //
    //         return parseInt(result.rows[0].count);
    //     } catch (e) {
    //         debug.db(`error ${e}`);
    //         return 0;
    //     }
    // },
    // async getAll(queryParams: IUserQueryParams = {}) {
    //     const {sort, search, offset, limit} = queryParams;
    //     const params: any[] = [];
    //     let sql = base_sql;
    //
    //     if (search) {
    //         sql += `where status >= 1 and u.name LIKE '%${search}%'`;
    //     }
    //     if (sort) {
    //         sql += ` order by ${sort}`;
    //     }
    //     if (offset) {
    //         params.push(offset);
    //         sql += ` offset $${params.length}`;
    //     }
    //     if (limit) {
    //         params.push(limit);
    //         sql += ` limit $${params.length}`;
    //     }
    //     sql += ";";
    //     debug.db({sql, params});
    //     const result = await db.query(sql, params);
    //
    //     return result.rows;
    // },
    async getById({id, userId} : {id: string, userId: string}) {
        const sql = `${BASE_SQL_ROOMS} where rooms.id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        const room = result.rows[0];

//        TODO: Info For group chat
// ${BASE_SQL_ROOM_MEMBERS}
//        TODO: Info For friend chat
        const sqlRoomInfo = `
            select "roomId",
                   "memberId",
                   "joinAt",
                   u.id as "userId",
                   "fullName",
                   gender,
                   u.email,
                   "phoneNumber",
                   address,
                   "wardId",
                   "classId",
                   u.status as "userStatus",
                   "avatarUrl"
            from chatRoomMember
                join users u on chatRoomMember."memberId" = u.id
                join userAccounts uA on u.id = uA."userId"
            where not "memberId" = $2 and "roomId" = $1 and u.status >= 1 limit 1;
        `;
        const paramsRoomInfo = [result.rows[0].id, userId];
        const resultRoomInfo = await db.query(sqlRoomInfo, paramsRoomInfo);
        room.size = 2;
        room.name = resultRoomInfo.fullName || resultRoomInfo.email;

        return room;
    },
    async getByUserId(userId: string) {
        const sql = `
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

            chatRoomMember."currentMessageIndex"
        from chatRoom
            left join chatRoomType on chatRoom."typeId" = chatRoomType.id
            left join chatRoomMember on chatRoom.id = chatRoomMember."roomId"
            where chatRoom.status >= 1 and "memberId" = $1 and chatRoomMember.status = 1;
        `;
        const params = [userId];
        const result = await db.query(sql, params);
        debug.db("Chat room: ", {result, params});

        const rooms = await Promise.all(result.rows.map(async (room) => {
            if (room.typeId === 4) {
                const sqlRoomInfo = `select * from  groupChatRoomInfo where "roomId" = $1;`
                const paramsRoomInfo = [room.id];
                const resultRoomInfo = await db.query(sqlRoomInfo, paramsRoomInfo);
                debug.db("Chat room info group: ", {result: resultRoomInfo.rows, paramsRoomInfo});
                room.size = resultRoomInfo.rows[0].size;
                room.roomName = resultRoomInfo.rows[0].name;
                room.avatarUrl = resultRoomInfo.rows[0].avatarUrl;
            } else {
                const sqlRoomInfo = `
            select "roomId",
                   "memberId",
                   "joinAt",
                   u.id as "userId",
                   "fullName",
                   gender,
                   u.email,
                   "phoneNumber",
                   address,
                   "wardId",
                   "classId",
                   u.status as "userStatus",
                   "avatarUrl"
            from chatRoomMember
                join users u on chatRoomMember."memberId" = u.id
                join userAccounts uA on u.id = uA."userId"
            where not "memberId" = $2 and "roomId" = $1 and u.status >= 1 limit 1;
        `;
                const paramsRoomInfo = [result.rows[0].id, userId];
                const resultRoomInfo = await db.query(sqlRoomInfo, paramsRoomInfo);

                debug.db("Chat room info: ", {result: resultRoomInfo.rows, paramsRoomInfo});
                room.size = 2;
                room.roomName = resultRoomInfo.rows[0].fullName || resultRoomInfo.rows[0].email;
                room.avatarUrl = resultRoomInfo.rows[0].avatarUrl;
            }

            return room;
        }));
        console.log(rooms);
        return rooms;
    },
    async getRoomMembersByRoomId(id: string) {

    },
    async getMessages({
        roomId, readMessagesFromIndex, readLimit
                      }: {roomId: string, readMessagesFromIndex?: number, readLimit?: number}) {
        const sql = ``;
        const params = [];
        const result = await db.query(sql, params);

        debug.db({sql, result});

        return result.rows;
    },
    async getAllMessagesByRoomId(id: string) {
        return this.getMessages({roomId: id});
    },
//     async getByCollegeId(id: string) {
//         const sql = `${base_sql} where c.college_id = $1`;
//         const params = [id];
//         const result = await db.query(sql, params);
//         return result.rows;
//     },
//     async getByCourseId(id: string) {
//         const sql = `${base_sql} where c.course_id = $1`;
//         const params = [id];
//         const result = await db.query(sql, params);
//         return result.rows;
//     },
//     async getByClassId(id: string) {
//         const sql = `${base_sql} where u.class_id = $1`;
//         const params = [id];
//         const result = await db.query(sql, params);
//         return result.rows;
//     },
//     async getByDepartmentId(id: string) {
//         const sql = `${base_sql} where cl.department_id = $1`;
//         const params = [id];
//         const result = await db.query(sql, params);
//         return result.rows;
//     },
//     async create({email, full_name, birthday, gender, phone_number, address, class_id, created_by, updated_by, status = 1}: IUser) {
//         const now = new Date();
//         let sql = `insert into
//                     users (email, full_name, birthday, gender, phone_number, address, class_id, created_by, created_at, updated_by, updated_at, status)
//                     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) returning *`;
//         const params = [email, full_name, birthday, gender, phone_number, address, class_id, created_by, now, updated_by, now, status];
//
//         const result = await db.query(sql, params);
//         return result.rows[0];
//     },
//
// //    Utils
//     async getClassById(id: string) {
//         const sql = 'select * from classes where id = $1 limit 1';
//         const params = [id];
//
//         const result = await db.query(sql, params);
//         return result.rows[0];
//     }
};