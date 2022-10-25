import {Express} from "express";
const {OAuth2Client} = require('google-auth-library');
const config = require("../../config");
const oAuth2Client = new OAuth2Client({
    clientId: config.oauth_google.client_id,
    clientSecret: config.oauth_google.client_secret,
});
const code = '4/0ARtbsJoI2iksv62kF5yzNk7ppttXawyRjl0EWdqxYbAUsjeKTVV0ZouL86A1LZAl7-AWSQ';
const scope = 'email profile openid https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';
// async function verify(token: string) {
//     const ticket = await client.verifyIdToken({
//         idToken: token,
//         audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
//         // Or, if multiple clients access the backend:
//         //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
//     });
//     const payload = ticket.getPayload();
//     const userid = payload['sub'];
//     // If request specified a G Suite domain:
//     // const domain = payload['hd'];
// }

async function GetService(code: string) {

}

module.exports = (app: Express) => {
    app.post("/auth/google/register", async (req, res) => {
        // const code = req.body.code;
        // Now that we have the code, use that to acquire tokens.
        const r = await oAuth2Client.getToken(code);
        console.log(r);

        // const refreshToken = service.createAccount({refreshToken: "", accessToken: "", expiredAt: res.expiresInSeconds + new });
        // // Make sure to set the credentials on the OAuth2 client.
        // oAuth2Client.setCredentials(r.tokens);
        //
        //

        return res.json("oke");
    })
   // app.post("/auth/google/login", (req, res) => {
   //      const token = req.headers["authorization"].split(" ")[1];
   //      verify(token).catch((e) => {
   //          console.error(e);
   //          return res.json("Error");
   //      });
   //
   //      return res.json("oke");
   // })
}