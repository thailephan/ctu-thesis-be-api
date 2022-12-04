module.exports = {
    groupId: process.env.KAFKA_GROUP_CONSUMER_ID,
    clientId: process.env.KAFKA_CLIENT_ID,
    baseTopic: process.env.KAKFA_API_TOPIC,
    logTopic: process.env.KAKFA_LOG_TOPIC,
    logMessageKey: process.env.KAFKA_LOG_PRODUCER_MESSAGE_KEY,
    mailTopic: process.env.KAKFA_MAIL_TOPIC,
}