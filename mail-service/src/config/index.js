module.exports = {
    settings: {
        groupId: process.env.KAFKA_GROUP_ID,
    },
    oauth_google: require("./oauth-google.config"),
}