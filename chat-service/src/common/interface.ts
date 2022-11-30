import { Socket } from "socket.io";
import {DefaultEventsMap} from "socket.io/dist/typed-events";
import {RedisClientType, RedisDefaultModules, RedisFunctions, RedisModules, RedisScripts} from "redis";
import {AxiosInstance} from "axios";

export interface OverrideSocket extends Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>{
    currentUser?: any;
    accessToken?: string;
}
export interface IService {
    api: AxiosInstance;
    asset: AxiosInstance;
}
export interface IRedis extends  RedisClientType<RedisDefaultModules & RedisModules, RedisFunctions, RedisScripts> {

}