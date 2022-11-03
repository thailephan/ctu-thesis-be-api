import {ICondition, IQueryParams} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
const { BASE_SQL_FRIENDS } = require("../../common/constants");
const { commonService } = require("../common");

module.exports = {
    ...commonService,
    // async count(condition: ICondition) {
    //     const { search, status = 1 } = condition;
    //     try {
    //         let sql = `select count(*) from friends`;
    //         sql += `where status >= ${status}`;
    //
    //         if (search) {
    //             sql += ` and name LIKE '%${search}%'`
    //         }
    //         const result = await db.query(sql);
    //         return parseInt(result.rows[0].count);
    //     } catch (e) {
    //         debug.db(`error ${e}`);
    //         return 0;
    //     }
    // },
    // async getAll(queryParams: IQueryParams = {}) {
    //     const {sort, search, offset, limit} = queryParams;
    //     let sql = `${BASE_SQL_FRIENDS} where fr.status >= 1`
    //     const params: any[] = [];
    //
    //     if (search) {
    //         sql += ` and name LIKE '%${search}%'`;
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
    async getByUserId(id: string) {
        const sql = `${BASE_SQL_FRIENDS} where sender.id = $1 OR receiver.id = $1`;
        const params = [id]
        const result = await db.query(sql, params);
        return result.rows;
    },
    // async create({created_by, id_receiver, id_sender, status = 1, updated_by}: {id_sender: number, id_receiver:  number, status?: number, created_by?: number, updated_by?: number}) {
    //     const client = await db.getClient();
    //
    //     try {
    //         await client.query('BEGIN');
    //         // TODO: Process with promise instead of async/await for not related sections
    //         // 1 - Remove from friend request
    //         const delete_friendRequest_sql = 'delete from friend_requests where (id_receiver = $1 and id_sender = $2) OR (id_receiver = $2 and id_sender = $1) returning *;';
    //         const delete_friendRequest_params = [id_sender, id_receiver];
    //         const result_friendRequest = await client.query(delete_friendRequest_sql, delete_friendRequest_params);
    //
    //         // 2 - Add tofriends
    //         const create_friends_sql = 'insert into friends(id_sender, id_receiver, created_by, updated_by, status) values($1, $2, $3, $4, $5) returning *;';
    //         const create_friends_params = [id_sender, id_receiver, created_by, updated_by, status];
    //         const result_friends = await client.query(create_friends_sql, create_friends_params);
    //
    //         // 3 - Create chat room for users
    //         const create_chatRoom_sql = 'insert into chat-rooms(room_info_id, room_type) values($1, $2) returning *;';
    //         // TODO: Handle new room type diff from 2 (friend)
    //         const create_chatRoom_params = [null, 2];
    //         const result_chatRoom = await client.query(create_chatRoom_sql, create_chatRoom_params);
    //
    //         // 4 - Insert room member to room
    //         // 4.1 - Sender (1st user)
    //         const create_roomMember_sql = 'insert into room_member(room_id, user_id, current_message, invited_by, status, updated_by) values ($1, $2, $3, $4, $5, $6) returning *;';
    //         const create_roomMember_params = [result_chatRoom.rows[0].id, id_sender, 0, null, status, updated_by];
    //         const result_roomMember = await client.query(create_roomMember_sql, create_roomMember_params);
    //
    //         // 4.2 - Receiver (2nd user)
    //         const create_roomMember_sql_receiver = 'insert into room_member(room_id, user_id, current_message, invited_by, status, updated_by) values ($1, $2, $3, $4, $5, $6) returning *;';
    //         const create_roomMember_params_receiver = [result_chatRoom.rows[0].id, id_receiver, 0, null, status, updated_by];
    //         const result_roomMember_receiver = await client.query(create_roomMember_sql_receiver, create_roomMember_params_receiver);
    //
    //         debug.db({
    //             friendRequest: result_friendRequest.rows,
    //             friends: result_friends.rows,
    //             chatRoom: result_chatRoom.rows,
    //             roomMember: [result_roomMember.rows, result_roomMember_receiver.rows],
    //         })
    //         await client.query('COMMIT');
    //     } catch (e) {
    //         await client.query('ROLLBACK')
    //         throw e
    //     } finally {
    //         client.release()
    //     }
    //
    //     return null;
    // },

    // async update({id, name = null, course_id = null, college_id = null, status = 1, updated_by = null}: {id: string, name: string, course_id: string, college_id: string, updated_by: string, status: number}) {
    //     const sql = 'update classes set name = $1, course_id = $2, college_id = $3, updated_at = $4, updated_by = $5, status = $6 WHERE id = $7';
    //     // const sql = 'DELETE FROM classes WHERE id = $1';
    //     const params = [name, (new Date()).getTime(), updated_by, status, id];
    //     const result = await db.query(sql, params);
    //     return result.rows[0] || null;
    // },
    // async delete(id: string) {
    //     const sql = 'update classes set status = -1,  updated_at = $1 where id = $2';
    //     // const sql = 'DELETE FROM classes WHERE id = $1';
    //     const params = [(new Date()).getTime(), id];
    //     try {
    //         const result = await db.query(sql, params);
    //         return result.rows[0] || null;
    //     } catch (e) {
    //         debug.db(e);
    //         return null;
    //     }
    // }
};
