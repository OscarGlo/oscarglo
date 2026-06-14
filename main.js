const https = require("https");
const {createProxyServer} = require('http-proxy');
const express = require("express");

const secrets = require("./secrets.json");

const app = express();
const httpsServer = https.createServer(app);

function logDate() {
    const d = new Date().toISOString().replace("T", " ");
    return d.substring(0, d.lastIndexOf("."));
}

async function setKeys() {
    const keys = await fetch(
        "https://api.porkbun.com/api/json/v3/ssl/retrieve/oscarglo.dev",
        {
            method: "POST",
            body: JSON.stringify(secrets),
        }
    ).then(res => res.json());

    httpsServer.setSecureContext({
        key: keys.privatekey,
        cert: keys.certificatechain
    });

    console.log(`[${logDate()}] Updated SSL certificates (status = ${keys.status})`)
}

// Update certificate every hour
setKeys();
setInterval(setKeys, 7 * 24 * 60 * 60 * 1000);

const manysweeperProxy = createProxyServer({target: 'http://oscarglo.dev:9000', ws: true});
const canvasProxy = createProxyServer({target: 'http://oscarglo.dev:9001'});

for (const proxy of [manysweeperProxy, canvasProxy])
    proxy.on("error", function (err, req, res) {
        console.error(`[${logDate()}]`, req.url, err);
        res.sendStatus(500);
    });

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

httpsServer.listen({port: 443}, () => {
    console.log(`[${logDate()}] Listening on https://localhost:443/`);
});