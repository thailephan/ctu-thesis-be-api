import cassandra from "cassandra-driver";
import {randomUUID} from "crypto";
import getTime from "date-fns/getTime";

const debug = require("../common/debugger");

const PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
const client = new cassandra.Client({
    contactPoints:["127.0.0.1:9042"],
    localDataCenter: "datacenter1",
    keyspace: "lv",
    authProvider: new PlainTextAuthProvider("cassandra", "cassandra")
});
client.on("connected", args => {
    debug.cassandra("connected", args);
})
client.on("error", args => {
    debug.cassandra("error", args);
})

// const now = getTime(new Date());
// let query = `
// insert into group_type (id, created_at, created_user, group_code, name, updated_at, updated_user, deleted)
// values(?, ?, ?, ?, ?, ?, ?, ?)`;
// const params = [randomUUID(), now, null, 'multi_user', 'multi_user', now, null, false]
// client.execute(query, params, {prepare: true}).then(r => debug.cassandra('Insert' + r.toString()))

module.exports = client;