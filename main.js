const https = require("https");
const proxy = require('express-http-proxy');
const fs = require("fs");
const express = require("express");

const app = express();

app.use((req, res, next) => {
    let redirect = false;

    const path = req.path.split("/").slice(1);
    if (path[0] === "manysweeper") {
        path.splice(0, 1);
        redirect = true;
    }

    if (redirect || req.subdomains[0] === "manysweeper")
        return proxy(`https://oscarglo.dev:8443/${path}`)(req, res, next);

    next();
});

app.use(express.static("public"))

app.get("/", (req, res) => res.sendFile("public/index.html"));

const httpsServer = https.createServer({
    key: fs.readFileSync('ssl/private.key.pem', 'utf8'),
    cert: fs.readFileSync('ssl/domain.cert.pem', 'utf8')
}, app);

httpsServer.listen({ port: 443 }, () => console.log("Listening on https://localhost:443/"));