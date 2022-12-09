import {createClient, RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts} from "redis";
export interface IRedis extends  RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts> {
}

const redisClient: IRedis = createClient();

module.exports = {
    redis: redisClient,
    redisInit: async function() {
        await redisClient.connect();
    }
};
