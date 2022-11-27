export {}
const db = require("../../repository");

module.exports = {
    getAll: async () => {
        const sql = `select * from messageTypes`;
        const result = await db.query(sql);
        return result.rows;
    }
}