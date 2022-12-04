require("dotenv").config({
    path: ".env.development.local",
})
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const config = require("../config");
const {producer} = require("./kafka");
const helpers = require("./helpers");

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    config.oauth_google.client_id, // ClientID
    config.oauth_google.client_secret, // Client Secret
    config.oauth_google.redirect_url, // Redirect URL
);
oauth2Client.setCredentials({
    refresh_token: config.oauth_google.refresh_token,
});

module.exports = {
    _sendMailHandler: ({ mailOptions, req, res }) => {
        return oauth2Client.getAccessToken().then((accessToken) => {
            const smtpTransport = nodemailer.createTransport({
                host: config.oauth_google.smtp_domain,
                port: config.oauth_google.smtp_port,
                secure: true,
                auth: {
                    type: "OAuth2",
                    user: config.oauth_google.email_address,
                    clientId: config.oauth_google.client_id,
                    clientSecret: config.oauth_google.client_secret,
                    refreshToken: config.oauth_google.refresh_token,
                    accessToken: accessToken.token,
                },
            });

            smtpTransport.sendMail(mailOptions, async (err, response) => {
                if (err) {
                    throw err;
                } else {
                    await producer.send(helpers.getKafkaLog({
                        messages: [helpers.getLog({
                            type: "success",
                            errorMessage: null,
                            executedFunction: "smtpTransport.sendMail",
                            data: response,
                            request: {
                                query: req.query, params: req.params, body: req.body,
                            },
                        })]
                    }));
                    return res.status(200).json({
                        success: true,
                        message: null,
                        data: "Oke",
                        statusCode: 200,
                    })
                }
            });
        }).catch(async e => {
            await producer.send(helpers.getKafkaLog({
                messages: [helpers.getLog({
                    type: "success",
                    errorMessage: e.message,
                    executedFunction: "_sendMailHandler",
                    data: null,
                    request: {
                        query: req.query, params: req.params, body: req.body,
                    },
                })]
            }));
            throw e;
        });
    }
}