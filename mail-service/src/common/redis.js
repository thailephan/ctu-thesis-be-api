const { createClient } = require("redis");
const redisClient = createClient();

module.exports = {
    redis: redisClient,
    redisInit: async function() {
        await redisClient.connect();
    }
};
