import {IMessageQueryParams} from "../../common/interface";

const debug = require("../../common/debugger");
const db = require("../../repository");
const client = require("../../repository/cassandra");

module.exports = {
    getAll: async ({ channelId }: IMessageQueryParams) => {
        const result = await client.execute(`select * from messagesByChannels where "channelId" = ${channelId};`);
        return result.rows;
    },
    createMessage: async (message: { channelId: any, messageTypeId: any, message: string, replyForMessageId?: any }) => {

    },
};