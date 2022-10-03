// https://firebase.google.com/docs/reference/admin/node/firebase-admin.storage
import admin from "firebase-admin";

const serviceAccount = require("../assets/firebase/service-account-key.json");
const config = require("../config");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // TODO: wrong database url plz check on firebase console
    // databaseURL: "https://thesis-2022-asset-storage.firebaseio.com",
    storageBucket: config.firebase.storageBucket,
});

// export const firebaseDB = getDatabase(app);
// export const getFirebaseAuth = () => admin.auth();
// export const getFirebaseStorageBucket = () => admin.storage().bucket();

module.exports = {
    bucket: admin.storage().bucket(),
    firebase: admin,
};
