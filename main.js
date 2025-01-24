const https = require("https");
const { createProxyServer } = require('http-proxy');
const fs = require("fs");
const express = require("express");

const app = express();
const server = https.createServer(app);
const proxy = createProxyServer({ target: 'https://localhost:8443' });

server.on('upgrade', (req, socket, head) => {
    console.log("upgrade", req, socket, head);
    proxy.ws(req, socket, head);
});

app.use((req, res, next) => {
    let redirect = false;

    const path = req.path.split("/").slice(1);
    if (path[0] === "manysweeper") {
        path.splice(0, 1);
        redirect = true;
    }

    if (redirect || req.subdomains[0] === "manysweeper")
        return proxy.web(req, res);

    next();
});

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("public/index.html"));

const httpsServer = https.createServer({
    key: fs.readFileSync('ssl/private.key.pem', 'utf8'),
    cert: fs.readFileSync('ssl/domain.cert.pem', 'utf8')
}, app);

httpsServer.listen({ port: 443 }, () => console.log("Listening on https://localhost:443/"));