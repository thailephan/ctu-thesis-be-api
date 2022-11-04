// module.exports = {
//     database: "fmlrcggl",
//     user: "fmlrcggl",
//     host: "satao.db.elephantsql.com",
//     port: 5432,
//     password: "Hoz7LMLIAnQw48ZT_MZAVcwjjebSRXPm",
// }
module.exports = {
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    host: "13.229.88.225",
    // host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    password: process.env.POSTGRES_PASSWORD,
}