require("dotenv").config({
    path: ".env.local.development",
})
const path = require("path");
const ejs = require("ejs");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const cors = require("cors");
const config = require("./config");
const Helpers = require("./common/helpers");
const debug = require("./common/debugger");
const express = require("express");
const app = express();

const OAuth2 = google.auth.OAuth2;
const oauth2Client = new OAuth2(
    config.oauth_google.client_id, // ClientID
    config.oauth_google.client_secret, // Client Secret
    config.oauth_google.redirect_url, // Redirect URL
);
oauth2Client.setCredentials({
     refresh_token: config.oauth_google.refresh_token,
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
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

app.post("/sendResetPasswordEmail", async (req, res) => {
    const {to, fullName, resetUrl} = req.body;
    // 'to' may be come from user email (required email for all account)

    ejs.renderFile(__dirname + '/email-template/reset-password.template.ejs', { resetUrl, fullName }, (err, data) => {
        if (err) {
            console.log(err);
            return;
        }
        const mailOptions = {
            from: config.oauth_google.email_address,
            to,
            subject: "[Chat] Đặt lại mật khẩu",
            html: data,
        };

        oauth2Client.getAccessToken().then((accessToken) => {
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
                if (error) {
                    console.log(error);
                    throw Error(error);
                } else {
                    console.log(response);
                }
                smtpTransport.close();
            });

            return res.status(200).json({
                success: true,
                message: null,
                data: "Oke",
                statusCode: 200,
            })
        }).catch(e => {
            console.log(e);
            return res.status(200).json({
                success: false,
                message: e.message,
                data: null,
                statusCode: 400,
            })
        });
    });
})

app.listen(4003, () => {
    console.log("Listening 4003");
})