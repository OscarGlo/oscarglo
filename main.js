const https = require("https");
const { createProxyServer } = require('http-proxy');
const fs = require("fs");
const express = require("express");

const app = express();
const proxy = createProxyServer({ target: 'https://localhost:8443', ws: true });

app.use((req, res, next) => {
    if (req.subdomains[0] === "manysweeper") {
        if (req.headers.upgrade === "websocket")
            return proxy.ws(req, req.socket);
        return proxy.web(req, res);
    }

    next();
});

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("public/index.html"));

const httpsServer = https.createServer({
    key: fs.readFileSync('ssl/private.key.pem', 'utf8'),
    cert: fs.readFileSync('ssl/domain.cert.pem', 'utf8')
}, app);

httpsServer.listen({ port: 443 }, () => console.log("Listening on https://localhost:443/"));