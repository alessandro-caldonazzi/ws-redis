/**
 * @module Server
 */

const exposedMethods = require("./exposedMethods");
const ws = require("ws");
const utils = require("./utils");
const handling = require("./handling");
const Redis = require("ioredis");
let redisPublisher, redisSubscriber, websocket, pingPongInterval;

function setup() {
    websocket.on("connection", function connection(ws) {
        ws.isAlive = true;
        ws.on("message", async function incoming(message) {
            if (message === "pong") {
                ws.isAlive = true;
                ws.send("ack");
            }
            if (!utils.isJson(message)) return;
            message = JSON.parse(message);
            if (utils.isInitial(message)) {
                let checkAuthenticationCallback = handling.config.checkAuthenticationCallback;

                if (message.token && checkAuthenticationCallback) {
                    const isAuthenticated = await checkAuthenticationCallback(message.token);
                    if (!isAuthenticated) return;
                }
                handling.config.onConnectionCallback(ws, message.token);
            } else {
                handling.handleMessage(message, ws);
            }
        });
        ws.on("close", () => {
            handling.deleteUserByConnection(ws);
        });
        ws.on("error", (e) => {
            console.log(e);
        });
    });
}

/**
 * Send message to a specific user
 * @param {string} identifier - Username / user identifier
 * @param {string} channel - Channel name (client will receive a message on this channel)
 * @param {*} data - Data to send
 */
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

/**
 * Send message to all users in the given group
 * @param {string} identifier - Group name
 * @param {string} channel - Channel name (clients will receive a message on this channel)
 * @param {*} data - Data to send
 * @param {boolean=} pubOnRedis - Whether to publish on redis to ensure delivery to all clients
 */
function sendMessageToGroup(identifier, channel, data, pubOnRedis = true) {
    if (identifier in handling.groups) {
        handling.groups[identifier].forEach((user) => {
            user.send(JSON.stringify({ data, channel }));
        });
    }
    if (pubOnRedis) {
        redisPublisher.publish(
            "ws-redis",
            JSON.stringify({ identifier, channel, data, isGroup: true, pid: process.pid })
        );
    }
}

/**
 * Initiate ws-redis
 * @param {WebSocket} wsInstance - WebSocket server instance
 * @return {Promise} Promise object rapresents the redis status
 */
async function init(wsInstance) {
    return new Promise((resolve, reject) => {
        if (!(wsInstance instanceof ws || wsInstance instanceof ws.Server)) {
            return reject("wsInstance must be a WebSocket instance");
        }
        websocket = wsInstance;
        setup();
        if (!redisPublisher) redisPublisher = new Redis();
        if (!redisSubscriber) {
            redisSubscriber = new Redis();

            redisSubscriber.on("message", (c, message) => {
                //TODO: check if the message is valid
                const { identifier, channel, data, isGroup, pid } = JSON.parse(message);
                if (pid == process.pid) return;
                if (isGroup && identifier in handling.groups) {
                    sendMessageToGroup(identifier, channel, data, false);
                } else if (identifier in handling.users) {
                    sendMessageToUser(identifier, channel, data);
                }
            });
            redisSubscriber.subscribe("ws-redis", (err) => {
                if (err) reject(err);
                else resolve();
            });
        } else {
            resolve();
        }

        pingPongInterval = setInterval(() => {
            handling.pingPong(websocket);
        }, 2000);
    });
}

module.exports = {
    ...exposedMethods,
    init,
    close: async () => {
        await websocket.close();
        clearInterval(pingPongInterval);
    },
    clean: () => {
        handling.clean();
    },
    sendMessageToUser,
    sendMessageToGroup,
};
