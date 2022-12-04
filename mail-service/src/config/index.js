module.exports = {
    db: require("./db.config"),
    service: {
        mailServiceUrl: process.env.MAIL_SERVICE_URL,
        webServiceUrl: process.env.WEB_SERVICE_URL,
    },
    settings: {
        groupId: process.env.KAFKA_GROUP_CONSUMER_ID,
        clientId: process.env.KAFKA_CLIENT_ID,
        baseTopic: process.env.KAKFA_MAIL_TOPIC,
        logTopic: process.env.KAKFA_LOG_TOPIC,
        logMessageKey: process.env.KAFKA_LOG_PRODUCER_MESSAGE_KEY,
    },
    oauth_google: require("./oauth-google.config"),
}