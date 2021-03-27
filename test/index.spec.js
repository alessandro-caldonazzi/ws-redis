const wsRedis = require("../src/index");
const WebSocket = require("ws");
const client = require("./client.test");

wsRedis.onConnection((ws, identifier) => {
    console.log("new connection from " + identifier);
});

wsRedis.onMessage("test", (data) => {
    console.log(data);
});

wsRedis.init(new WebSocket.Server({ port: 8080 }));
