const https = require("https");
const { createProxyServer } = require('http-proxy');
const fs = require("fs");
const express = require("express");

const app = express();
const httpsServer = https.createServer({
    key: fs.readFileSync('ssl/private.key.pem', 'utf8'),
    cert: fs.readFileSync('ssl/domain.cert.pem', 'utf8')
}, app);

const manysweeperProxy = createProxyServer({ target: 'http://oscarglo.dev:9000', ws: true });
const canvasProxy = createProxyServer({ target: 'http://oscarglo.dev:9001' });

httpsServer.on("upgrade", (req, socket, head) => manysweeperProxy.ws(req, socket, head));

app.use((req, res, next) => {
    if (req.subdomains[0] === "manysweeper")
        return manysweeperProxy.web(req, res);
    if (req.subdomains[0] === "canvas")
        return canvasProxy.web(req, res);

    next();
});

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("public/index.html"));

httpsServer.listen({ port: 443 }, () => console.log("Listening on https://localhost:443/"));