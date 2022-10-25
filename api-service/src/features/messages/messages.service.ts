import {IMessageQueryParams} from "../../common/interface";

const debug = require("../../common/debugger");
const db = require("../../repository");
const { IMessageQueryParams } = require("../../common/interface");

module.exports = {
    // Get Paged
    // body: page, size <=> (offset, limit), room_id, user_id, start_read_message

    // Search mesasges
    // search
    async count(room_id: number) {
        try {
            let sql = `select message_total from rooms where id = ${room_id}`;
            const result = await db.query(sql);
            return result.rows[0].message_total;
        } catch (e) {
            debug.db(`error ${e}`);
            return 0;
        }
    },
    async getAll(queryParams: IMessageQueryParams) {
        const {start_read_message, limit, room_id } = queryParams;

        let sql = `select m.id,
                          m.room_id,
                          m.content,
                          ceil(extract(epoch from m.created_at)) as created_at,
                          u.id                                   as sender_id,
                          u.full_name                            as user_full_name,
                          u.avatar_url                           as user_avatar_url
                   from messages m
    join users u
                   on u.id = m.from_user_id
                   where room_id = $1
                   order by m.id`
        const params: any[] = [room_id];

        if (start_read_message) {
            params.push(start_read_message);
            sql += ` offset $${params.length}`;
        }
        if (limit) {
            params.push(limit);
            sql += ` limit $${params.length}`;
        }
        sql += ";";
        debug.db({sql, params});
        const result = await db.query(sql, params);

        return result.rows;
    },
    async create(message: any) {
        const {room_id, sender_id, content, status = 1, message_type_id} = message;
        const now = new Date();
        const client = await db.getClient();

        try {
            await client.query('BEGIN');
            // Insert new message to DB
            const message_query = `insert into messages(room_id, id, from_user_id, content, status, message_type_id)
                select $1, (rooms.message_total + 1) , $2, $3, $4, $5 from rooms where id = $1 returning *;`;
            const message_params = [room_id, sender_id, content, status, message_type_id];
            const new_message = await client.query(message_query, message_params);

            const room_updated_params = [now, room_id];
            const room_updated_query = `update rooms set message_total= rooms.message_total + 1, updated_at = $1 where id = $2 returning *;`;
            const room_updated = await client.query(room_updated_query, room_updated_params);
            debug.db({
                new_message,
                room_updated,
            });

            await client.query('COMMIT');

            debug.db(new_message.rows[0]);
            return new_message.rows[0];
        } catch (e) {
            await client.query('ROLLBACK')
            throw e
        } finally {
            client.release()
        }
    },
};