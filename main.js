const https = require("https");
const { createProxyServer } = require('http-proxy');
const fs = require("fs");
const express = require("express");

const app = express();
const httpsServer = https.createServer({
    key: fs.readFileSync('ssl/private.key.pem', 'utf8'),
    cert: fs.readFileSync('ssl/domain.cert.pem', 'utf8')
}, app);
const proxy = createProxyServer({ target: 'https://localhost:8443', ws: true });

httpsServer.on("upgrade", (req, socket, head) => {
    console.log("UPGRADE")
    proxy.ws(req, socket, head);
})

app.use((req, res, next) => {
    if (req.subdomains[0] === "manysweeper") {
        if (req.headers.upgrade === "websocket")
            return proxy.ws(req, req.socket);
        return proxy.web(req, res);
    }

    next();
});

server.on("upgrade", (req, socket, head) => {
    if (req.subdomains[0] === "manysweeper") {
        proxy.ws(req, socket, head);
    }
});

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("public/index.html"));

httpsServer.listen({ port: 443 }, () => console.log("Listening on https://localhost:443/"));