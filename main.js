const https = require("https");
const fs = require("fs");
const express = require("express");

const app = express();

app.use(express.static("public"))

app.get("/", (req, res) => res.sendFile("public/index.html"));

const httpsServer = https.createServer({
    key: fs.readFileSync('ssl/private.key.pem', 'utf8'),
    cert: fs.readFileSync('ssl/domain.cert.pem', 'utf8')
}, app);

httpsServer.listen(443);