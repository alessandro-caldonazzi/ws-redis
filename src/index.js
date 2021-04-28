const exposedMethods = require("./exposedMethods");
const ws = require("ws");
const utils = require("./utils");
const handling = require("./handling");
const Redis = require("ioredis");
let redisPublisher, redisSubscriber, websocket;

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
        redisPublisher.publish(
            "ws-redis",
            JSON.stringify({ identifier, channel, data, isGroup: false })
        );
    }
}

function sendMessageToGroup(identifier, channel, data, except) {
    if (identifier in handling.groups) {
        handling.groups[identifier].forEach((user) => {
            user.send(JSON.stringify({ data, channel }));
        });
    }
    redisPublisher.publish(
        "ws-redis",
        JSON.stringify({ identifier, channel, data, isGroup: true })
    );
}

module.exports = {
    ...exposedMethods,
    init: (wsInstance) => {
        if (!(wsInstance instanceof ws || wsInstance instanceof ws.Server)) {
            throw new Error("wsInstance must be a WebSocket instance");
        }
        websocket = wsInstance;
        setup();
        if (!redisPublisher) redisPublisher = new Redis();
        if (!redisSubscriber) {
            redisSubscriber = new Redis();

            redisSubscriber.on("message", (channel, message) => {
                //TODO: check if the message is valid
                message = JSON.parse(message);
                if (message.isGroup && message.identifier in handling.groups) {
                    sendMessageToGroup(
                        message.identifier,
                        message.channel,
                        message.data
                    );
                } else if (message.identifier in handling.users) {
                    sendMessageToUser(
                        message.identifier,
                        message.channel,
                        message.data
                    );
                }
            });
            redisSubscriber.subscribe("ws-redis");
        }
    },
    close: async () => {
        await websocket.close();
    },
    clean: () => {
        handling.clean();
    },
    sendMessageToUser,
    sendMessageToGroup,
};
