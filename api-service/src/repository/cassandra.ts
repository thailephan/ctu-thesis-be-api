const cassandra = require("cassandra-driver");
const debug = require("../common/debugger");
const PlainTextAuthProvider = cassandra.auth.PlainTextAuthProvider;
const contactPoints = [process.env.NODE_ENV === "development_local" ? "127.0.0.1:9042" : `${process.env.POSTGRES_HOST}:9042`];
export const client = new cassandra.Client({
    contactPoints,
    localDataCenter: "datacenter1",
    keyspace: "lv",
    authProvider: new PlainTextAuthProvider("cassandra", "cassandra")
});
client.on("connected", () => {
    debug.cassandra("Connected", `Success connect to cassandra at points: ${JSON.stringify(contactPoints)}`);
})
client.on("error", args => {
    debug.cassandra("Error has happened", `Errors args: ${JSON.stringify(args)}`);
})

module.exports = client;