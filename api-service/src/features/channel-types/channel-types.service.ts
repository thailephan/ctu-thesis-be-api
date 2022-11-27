export {}
const db = require("../../repository");

module.exports = {
    getAll: async () => {
        const sql = `select * from channelTypes`;
        const result = await db.query(sql);
        return result.rows;
    }
}