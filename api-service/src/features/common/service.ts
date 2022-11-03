const db = require("../../repository");
const debug = require("../../common/debugger");
const { BASE_SQL_USERS } = require("../../common/constants");

module.exports = {
    async getById(id: string) {
        const sql = `${BASE_SQL_USERS} where u.id = $1`;
        const params = [id];
        const result = await db.query(sql, params);
        return result.rows[0];
    },
}
