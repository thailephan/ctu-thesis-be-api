import ejs from "ejs";
import nodemailer from "nodemailer";
import { google } from "googleapis";

const config = require("../../config");
const Helpers = require("../../common/helpers");
const debug = require("../../common/debugger");

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
    async resetPassword(to: string) {
        // TODO: Finish reset password function
        // 'to' may be come from user email (required email for all account)

        // Generate password
        const now = (new Date()).getTime();
        const randomValueForGeneratePassword = `${now} + ${Math.round(Math.random() * 100)}`;
        const password = Helpers.hash(to + now)?.slice(0, 6) + Helpers.hash(randomValueForGeneratePassword)?.slice(0, 6);
        if (isNaN(password)) {

            return;
        }
        // Save 'hash' password into user record
        const hash = Helpers.hash(password);
        if (!Helpers.isNullOrEmpty(hash)) {
            debug.debugger("service:mail", "unable to generate hash value");
            return;
        }
        ejs.renderFile(__dirname + '/template/reset-password.template.ejs', {password}, (err, data) => {
            if (err) {
                console.log(err);
                return;
            }
            const mailOptions = {
                from: config.oauth_google.email_address,
                to,
                subject: "Reset Ctu chat password",
                html: data,
            };

            oauth2Client.getAccessToken().then((accessToken: any) => {
                const smtpTransport = nodemailer.createTransport({
                    host: config.oauth_google.smtp_domain,
                    port: 465,
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

                smtpTransport.sendMail(mailOptions, (error, response) => {
                    error ? console.log(error) : console.log(response);
                    smtpTransport.close();
                });
            }).catch(e => {
                console.log(e);
            });
        });
    }
}