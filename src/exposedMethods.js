let { callbacks, users, groups, config } = require("./handling");

function onMessage(channel, callback) {
    if (typeof channel !== "string") throw new Error("Invalid channel name");
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    if (channel in callbacks) throw new Error("This channel is already registered");
    callbacks[channel] = callback;
}

function addUser(identifier, ws) {
    users[identifier] = ws;
}

function addToGroup(identifier, ws) {
    if (!groups[identifier]) groups[identifier] = [];
    groups[identifier].push(ws);
}

function deleteUser(identifier) {
    delete users[identifier];
}

function deleteGroup(identifier) {
    delete groups[identifier];
}

function onConnection(callback) {
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    if (config.onConnectionCallback) throw new Error("onConnectionCallback is already defined");
    config.onConnectionCallback = callback;
}

function checkAuthentication(callback) {
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    if (config.checkAuthenticationCallback)
        throw new Error("Authentication Callback is already defined");
    config.checkAuthenticationCallback = callback;
}

function onClientClosed(callback) {
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    config.onConnectionClosed = callback;
}

module.exports = {
    onMessage,
    checkAuthentication,
    addUser,
    addToGroup,
    deleteUser,
    deleteGroup,
    onConnection,
    onClientClosed,
};
