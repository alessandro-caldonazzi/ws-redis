const exposedMethods = require("./exposedMethods");
const ws = require("ws");
const utils = require("./utils");
const handling = require("./handling");
let websocket;

function setup() {
    websocket.on("connection", function connection(ws) {
        console.log("ws connection");
        ws.on("message", function incoming(message) {
            if (!utils.isJson(message)) return;
            message = JSON.parse(message);
            if (utils.isInitial(message)) {
                handling.config.onConnectionCallback(ws, message.token);
            } else {
                handling.handleMessage(message, ws);
            }
        });
    });
}

module.exports = {
    ...exposedMethods,
    init: (wsInstance) => {
        if (!(wsInstance instanceof ws || wsInstance instanceof ws.Server)) {
            throw new Error("wsInstance must be a WebSocket instance");
        }
        websocket = wsInstance;
        setup();
    },
};
