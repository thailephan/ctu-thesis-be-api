export {}
const db = require("../../repository");
const debug = require("../../common/debugger");

module.exports = {
    getAll: async () => {
        const sql = `select * from channelTypes`;
        const result = await db.query(sql);
        return result.rows;
    }
}