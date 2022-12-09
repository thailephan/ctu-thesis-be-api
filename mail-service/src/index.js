require("dotenv").config({
    path: ".env.development.local",
})
const path = require("path");
const ejs = require("ejs");
const cors = require("cors");
const express = require("express");
const config = require("./config");
const Helpers = require("./common/helpers");
const debug = require("./common/debugger");
const utils = require("./common/utils");
const { kafkaInit, producer } = require("./common/kafka");
const helpers = require("./common/helpers");
const db = require("./repository/postgres");

const { redis } = require("./common/redis");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

async function init() {
    await kafkaInit();
}

app.get("/reset-password", (req, res) => {
    const { code } = req.query;
    if (!code) {
        return res.status(400).json({
            success: false,
            message: "code không được rỗng",
           data: null,
       })
    }
   return res.render("reset-password", {
       code,
   });
})
app.get("/activate-account", (req, res) => {
    const { code, email } = req.query;
    if (!code) {
        return res.status(400).json({
            success: false,
            message: "code không được rỗng",
            data: null,
        })
    }
    if (!email) {
        return res.status(400).json({
            success: false,
            message: "Email không được rỗng",
            data: null,
        });
    }
    return res.render("activate-account", {
        code,
        email,
    });
})

app.post("/sendResetPasswordEmail", async (req, res) => {
    const { to, fullName, id } = req.body;
    const random = Helpers.randomString();
    const code = "000001." + random;
    const resetUrl = config.service.webServiceUrl + `/reset-password?code=${code}`;

    // 'to' may be come from user email (required email for all account)
    ejs.renderFile(__dirname + '/email-template/reset-password.template.ejs', { resetUrl, fullName }, async (err, data) => {
        if (err) {
            debug.api("renderFile", err.message, "ERROR");
            await producer.send(helpers.getKafkaLog({
                messages: [helpers.getLog({
                    type: "error",
                    errorMessage: err.message,
                    executedFunction: "POST sendResetPasswordEmail | ejs.renderFile",
                    data: null,
                    request: {
                        query: req.query, params: req.params, body: req.body,
                    },
                })]
            }));
            return;
        }
        const mailOptions = {
            from: config.oauth_google.email_address,
            to,
            subject: "[Chat] Đặt lại mật khẩu",
            html: data,
        };

        debug.api("POST sendResetPasswordEmail | Mail Options", JSON.stringify({
            fullName, resetUrl,
            from: config.oauth_google.email_address,
            to,
    }), "INFO");
        await producer.send(helpers.getKafkaLog({
            messages: [helpers.getLog({
                type: "info",
                data: {
                    fullName, resetUrl, to
                },
                request: {
                    query: req.query, params: req.params, body: req.body,
                },
                executedFunction: "POST sendResetPasswordEmail | renderFile ",
            })]
        }));
        return utils._sendMailHandler({ mailOptions, res, req }).then(async () => {
        const template = await db.query(`select * from mailTemplate where code = '000001'`);
        const templateExpireTime = template.rows[0]?.expireIn || 0;
        await redis.set(code, to);
        await redis.expire(code, templateExpireTime);
        const addEmailSend = (await db.query(`insert into mailing("templateId", "to", data, "createdBy", random) values ($1, $2, $3, $4, $5) returning *`, [template.id, to, to, id, random])).rows[0];
        debug.db("_sendMailHandler", `Query insert mailling: ${JSON.stringify(addEmailSend)}`, "INFO");

        // Logging kafka
        if (addEmailSend) {
            await producer.send(helpers.getKafkaLog({
                messages: [helpers.getLog({
                    type: "info",
                    data: addEmailSend,
                    request: {
                        query: req.query, params: req.params, body: req.body,
                    },
                    executedFunction: "POST sendResetPassword Email | _sendMailHandler | db.query",
                })]
            }));
        } else {
            await producer.send(helpers.getKafkaLog({
                messages: [helpers.getLog({
                    type: "error",
                    errorMessage: "Cannot insert new mailing",
                    request: {
                        query: req.query, params: req.params, body: req.body,
                    },
                    executedFunction: "POST sendResetPassword Email | _sendMailHandler | db.query",
                })]
            }));
        }
    });
    });
})

app.post("/sendActivateEmailAccount", async (req, res) => {
    const { to, fullName } = req.body;

    const random = helpers.randomString();
    const code = `000002.` + random;
    const activateUrl = config.service.webServiceUrl + `/account/activate?code=${code}`;

    ejs.renderFile(__dirname + '/email-template/activate-account.template.ejs', { to, fullName, activateUrl }, async (err, data) => {
        if (err) {
            await producer.send(helpers.getKafkaLog({
                messages: [helpers.getLog({
                    type: "error",
                    errorMessage: err.message,
                    executedFunction: "POST /sendActivateEmailAccount | ejs.renderFile",
                    data: null,
                    request: {
                        query: req.query, params: req.params, body: req.body,
                    },
                })]
            }));
            return;
        }
        const mailOptions = {
            from: config.oauth_google.email_address,
            to,
            subject: "[Chat] Kích hoạt tài khoản mới",
            html: data,
        };
        debug.api("POST /sendActivateEmailAccount | Mail Options", JSON.stringify({
            fullName, activateUrl,
            from: config.oauth_google.email_address,
            to,
        }), "INFO");
        await producer.send(helpers.getKafkaLog({
            messages: [helpers.getLog({
                type: "info",
                data: {
                    fullName, activateUrl, to
                },
                request: {
                    query: req.query, params: req.params, body: req.body,
                },
                executedFunction: "POST /sendActivateEmailAccount | renderFile ",
            })]
        }));

        return utils._sendMailHandler({ mailOptions, req, res }).then(async () => {
            const template = await db.query(`select * from mailTemplate where code = '000002'`);
            const templateExpireTime = template.rows[0]?.expireIn || 0;
            await redis.set(code, to);
            await redis.expire(code, templateExpireTime);
            const addEmailSend = (await db.query(`insert into mailing("templateId", "to", data, random) values ($1, $2, $3, $4) returning *`, [template.id, to, to, random])).rows[0];
            debug.db("_sendMailHandler", `Query insert mailling: ${JSON.stringify(addEmailSend)}`, "INFO");

            // Logging kafka
            if (addEmailSend) {
                await producer.send(helpers.getKafkaLog({
                    messages: [helpers.getLog({
                        type: "info",
                        data: addEmailSend,
                        request: {
                            query: req.query, params: req.params, body: req.body,
                        },
                        executedFunction: "POST sendActivateAccountEmail | _sendMailHandler | db.query",
                    })]
                }));
            } else {
                await producer.send(helpers.getKafkaLog({
                    messages: [helpers.getLog({
                        type: "error",
                        errorMessage: "Cannot insert new mailing",
                        request: {
                            query: req.query, params: req.params, body: req.body,
                        },
                        executedFunction: "POST sendActivateAccountEmail | _sendMailHandler | db.query",
                    })]
                }));
            }
        });
    });
})

app.post("/producer", async (req, res) => {
    const { topic, key, value } = req.body;

    try {
        const data = await producer.send({
            topic,
            messages: [{
                key, value: JSON.stringify(value),
            }],
        });
        return res.status(200).json({
            message: "",
            success: true,
            data
        })
    } catch (e) {
        return res.status(200).json({
            message: e.message,
            success: false,
        })
    }
});

app.listen(4003, async () => {
    await redis.connect();
    await init();
    debug.api("listen", "Server is listening on port 4003", "info");
})

const MailTemplate = {
    resetPassword: "000001",
    activateAccount: "000002",
}
