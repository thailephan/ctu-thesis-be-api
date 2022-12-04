module.exports = {
    client_id: process.env.OAUTH_GG_CLIENT_ID, // ClientID
    client_secret: process.env.OAUTH_GG_CLIENT_SECRET, // Client Secret
    redirect_url: process.env.OAUTH_GG_REDIRECT_URL,
    refresh_token: process.env.OAUTH_GG_CLIENT_REFRESH_TOKEN,
    email_address: process.env.OAUTH_GG_EMAIL,
    email_password: process.env.OAUTH_GG_EMAIL_PASSWORD,
    smtp_domain: process.env.GG_SMTP_DOMAIN,
    smtp_port: process.env.GG_SMTP_PORT,
}