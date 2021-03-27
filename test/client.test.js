const WsClient = require("../src/client/client");
const WebSocket = require("ws");

const connection = new WsClient({
    url: "ws://localhost:8080",
    websocket: WebSocket,
    identifier: "ale",
});

connection.onMessage("test", (message, ws) => {
    console.log(message);
});

connection.send("test", "hi from client");
