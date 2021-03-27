const WsClient = require("../src/client/client");
const WebSocket = require("ws");

module.exports = {
    connect: () => {
        const connection = new WsClient({
            url: "ws://localhost:8080",
            websocket: WebSocket,
            identifier: "clientIdentifier",
        });
    },
    sendMessageToChannel: () => {
        const connection = new WsClient({
            url: "ws://localhost:8080",
            websocket: WebSocket,
            identifier: "clientIdentifier",
        });
        connection.send("testChannel", "testMessage");
    },
};
