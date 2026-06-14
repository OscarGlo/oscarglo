const https = require("https");
const {createProxyServer} = require('http-proxy');
const express = require("express");

const secrets = require("./secrets.json");

const app = express();
const httpsServer = https.createServer(app);

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

    console.log(`[${new Date().toUTCString()}] Updated SSL certificates (status = ${keys.status})`)
}

// Update certificate every hour
setKeys();
setInterval(setKeys, 7 * 24 * 60 * 60 * 1000);

const manysweeperProxy = createProxyServer({target: 'http://oscarglo.dev:9000', ws: true});
const canvasProxy = createProxyServer({target: 'http://oscarglo.dev:9001'});

httpsServer.on("upgrade", (req, socket, head) => manysweeperProxy.ws(req, socket, head));

app.use((req, res, next) => {
    try {
        if (req.subdomains[0] === "manysweeper")
            return manysweeperProxy.web(req, res);
        if (req.subdomains[0] === "canvas")
            return canvasProxy.web(req, res);
    } catch (e) {
        console.error(`[${new Date().toISOString().replace("T", " ")}]`, req.url, e);
        return res.sendStatus(500);
    }

    next();
});

app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile("public/index.html"));

httpsServer.listen({port: 443}, () => {
    console.log(`[${new Date().toISOString().replace("T", " ")}] Listening on https://localhost:443/`);
});