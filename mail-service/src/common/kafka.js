const axios = require("axios");
const { Kafka, Partitioners } = require('kafkajs')
const config = require("../config");
const debug = require("./debugger");

const kafka = new Kafka({
    clientId: config.settings.clientId,
    brokers: ['localhost:9092'],
    retry: {
        retries: 10,
        initialRetryTime: 500,
    },
});
const consumer = kafka.consumer({groupId: config.settings.groupId});
const admin = kafka.admin();
const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });


const typeToAPI = new Map([["000002", {
    path: "/sendActivateEmailAccount",
    method: "post",
}], ["000001", {
    path: "/sendResetPasswordEmail",
    method: "post",
}]]);

module.exports.consumer = consumer;
module.exports.admin = admin;
module.exports.producer = producer;
module.exports.kafkaInit = async () => {
    await consumer.connect();
    await producer.connect();
    await admin.connect();

    await consumer.subscribe({topic: config.settings.baseTopic, fromBeginning: true});

    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            const data = JSON.parse(message.value.toString());

            debug.kafka("consumer.run (eachMessage)", JSON.stringify({topic, partition, data}), "INFO");

            if (data.type) {
                const queryMetadata = typeToAPI.get(data.type);
                if (queryMetadata) {
                    const { method, path } = queryMetadata;
                    await axios[method](config.service.mailServiceUrl + path, {
                        metadata: data.metadata,
                        ...data.data
                    });
                }
            }
        },
    });
}