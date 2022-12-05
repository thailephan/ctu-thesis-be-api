const {Pool} = require('pg');
const debug = require("../common/debugger");

const dbConfig = {
    user: "postgres",
    host: "0.0.0.0",
    port: 5432,
    database: "lv",
    password: "postgres_aBK922F8d@",
};
const pool = new Pool(dbConfig).on("error", err => {
    debug.db("Postgres DB", `Error: ${JSON.stringify(err)}`, "ERROR");
});

module.exports = {
    /**
    * Execute query from postgres database
    * @params {string} text
    * @params {Array<any>} params
    * @returns  {Promise<QueryResult<any>>}
    * */
    async query(text, params) {
        const start = Date.now();
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        debug.db('Executed query', JSON.stringify({ duration, rows: res.rowCount }), "INFO");
        return res;
    },
};