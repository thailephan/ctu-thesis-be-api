import {Producer, Kafka, Partitioners, Consumer, Admin} from "kafkajs";
import axios from "axios";
const { apiService, kafkaSettings } = require("../config");
const debug = require("./debugger");
const helpers = require("./helpers");

const kafka = new Kafka({
    clientId: kafkaSettings.clientId,
    brokers: ['localhost:9092'],
    retry: {
        retries: 10,
        initialRetryTime: 500,
    }
});

const producer: Producer = kafka.producer({ createPartitioner: Partitioners.LegacyPartitioner });
const consumer: Consumer = kafka.consumer({groupId: kafkaSettings.groupId });
const admin: Admin = kafka.admin();

module.exports = {
    producer, consumer, admin,
    init: async () => {
        await producer.connect();
        await consumer.connect();

        // TODO: Change "frombeginning" back to true after finish
        await consumer.subscribe({topic: kafkaSettings.baseTopic, fromBeginning: false});

        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                const { path, method, data, emitterId, response, emitterAccessToken } = JSON.parse(message.value.toString()) || {};

                debug.kafka("consumer.run (eachMessage)", JSON.stringify({topic, partition, data}), "INFO");

                if (helpers.isNullOrEmpty(method)) {
                    throw Error("Not found api method of event");
                }

                if ((method || "").toLowerCase() !== "get") {
                    const result = await axios[method](
                        apiService.URL + path,
                        data, {
                            headers: {
                                authorization: `Bearer ` + emitterAccessToken,
                            }
                        }
                    );
                    // await producer.send({
                    //     topic: "log-service",
                    //     messages: [
                    //         {key: response.topic.toString(), value: JSON.stringify({
                    //                 event: response.event,
                    //                 data: result.data.data,
                    //             })},
                    //     ]
                    // });
                    if (result.data.success) {
                        await producer.send({
                            topic: response.topic,
                            messages: [
                                {key: response.topic.toString(), value: JSON.stringify({
                                        event: response.event,
                                        data: result.data.data,
                                    })},
                            ]
                        });
                    }
                } else {
                    console.log("------------Get------------");
                }
            },
        });
    },
}
