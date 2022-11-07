import cassandra from "cassandra-driver";

const debug = require("../common/debugger");

const PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
export const client = new cassandra.Client({
    contactPoints:["127.0.0.1:9042"],
    localDataCenter: "datacenter1",
    keyspace: "lv",
    authProvider: new PlainTextAuthProvider("cassandra", "cassandra")
});
client.on("connected", () => {
    debug.cassandra("connected");
})
client.on("error", args => {
    debug.cassandra("error", args);
})

module.exports = client;