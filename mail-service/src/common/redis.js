const { createClient } = require("redis");
const redisClient = createClient();

module.exports.redisInit = async function() {
    await redisClient.connect();
};

module.exports.redisClient = redisClient;
