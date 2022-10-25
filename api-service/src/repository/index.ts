import {Pool} from 'pg';
const debug = require("../common/debugger");

const config = require("../config");

const pool = new Pool({
  user: config.db.user,
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  password: config.db.password,
}).on("error", err => {
  debug.db(err);
});

module.exports = {
  async query(text: string, params: any[] = []) {
    const start = Date.now()
    const res = await pool.query(text, params)
    const duration = Date.now() - start
    debug.db('executed query', { text, duration, rows: res.rowCount })
    return res
  },
  async getClient() {
    const client = await pool.connect()
    const query = client.query
    const release = client.release
    // set a timeout of 5 seconds, after which we will log this client's last query
    const timeout = setTimeout(() => {
      console.error('A client has been checked out for more than 5 seconds!')
      // @ts-ignore
      console.error(`The last executed query on this client was: ${client.lastQuery}`)
    }, 5000)
    // monkey patch the query method to keep track of the last query executed
    client.query = (...args) => {
      // @ts-ignore
      client.lastQuery = args
      return query.apply(client, args)
    }
    client.release = () => {
      // clear our timeout
      clearTimeout(timeout)
      // set the methods back to their old un-monkey-patched version
      client.query = query
      client.release = release
      return release.apply(client)
    }
    return client;
  }
}