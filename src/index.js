const exposedMethods = require("./exposedMethods");
const ws = require("ws");
const utils = require("./utils");
const handling = require("./handling");
let websocket;

function setup() {
    websocket.on("connection", function connection(ws) {
        ws.on("message", async function incoming(message) {
            if (!utils.isJson(message)) return;
            message = JSON.parse(message);
            if (utils.isInitial(message)) {
                let checkAuthenticationCallback =
                    handling.config.checkAuthenticationCallback;

                if (message.token && checkAuthenticationCallback) {
                    const isAuthenticated = await checkAuthenticationCallback(
                        message.token
                    );
                    if (!isAuthenticated) return;
                }
                handling.config.onConnectionCallback(ws, message.token);
            } else {
                handling.handleMessage(message, ws);
            }
        });
    });
}

function sendMessageToUser(identifier, channel, data) {
    if (identifier in handling.users) {
        handling.users[identifier].send(JSON.stringify({ data, channel }));
    } else {
        //redis publish
    }
}

function sendMessageToGroup(identifier, channel, data, except) {}

module.exports = {
    ...exposedMethods,
    init: (wsInstance) => {
        if (!(wsInstance instanceof ws || wsInstance instanceof ws.Server)) {
            throw new Error("wsInstance must be a WebSocket instance");
        }
        websocket = wsInstance;
        setup();
    },
    close: () => {
        websocket.close();
    },
    clean: () => {
        handling.clean();
    },
    sendMessageToUser,
    sendMessageToGroup,
};
