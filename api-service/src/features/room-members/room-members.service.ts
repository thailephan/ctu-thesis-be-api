import {IQueryParams, ICondition} from "../../common/interface";

const db = require("../../repository");
const debug = require("../../common/debugger");
const Helpers = require("../../common/helpers");

module.exports = {
    async getByUserId(user_id: number) {
        const sql = `select
            room_id,
            current_message,
            invited_by,
            status,
             ceil(extract(epoch from created_at)) as created_at,
             ceil(extract(epoch from updated_at)) as updated_at
        from room_member where user_id = $1;`;
        const params = [user_id];

        const result = await db.query(sql, params);
        if (Helpers.isNullOrEmpty(result)) {
            throw Error("room-member: unable to query room_member");
        }

        return result.rows;
    },
};
