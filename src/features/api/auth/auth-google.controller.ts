import {Express} from "express";
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = "494825094681-uvualgt6qfkmt7v8ondjbfgf38l9se4h.apps.googleusercontent.com";
const client = new OAuth2Client(CLIENT_ID);


async function verify(token: string) {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
        // Or, if multiple clients access the backend:
        //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
    });
    const payload = ticket.getPayload();
    const userid = payload['sub'];
    // If request specified a G Suite domain:
    // const domain = payload['hd'];
}

module.exports = (app: Express) => {
    // app.post("/auth/google/register", (req, res) => {
    //     const token = req.headers["authorization"].split(" ")[1];
    //     verify(token).catch((e) => {
    //         console.error(e);
    //         return res.json("Error");
    //     });
    //
    //     return res.json("oke");
    // })
   app.post("/auth/google/login", (req, res) => {
        const token = req.headers["authorization"].split(" ")[1];
        verify(token).catch((e) => {
            console.error(e);
            return res.json("Error");
        });

        return res.json("oke");
   })
}