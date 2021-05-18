/**
 * @module Server
 */
require("./jsdocTypeDef");
let { callbacks, users, groups, config } = require("./handling");

/**
 * Set the callback to call when the user receive a message
 * @param {string} channel - Channel name to listen to
 * @param {onMessageCallbackServer} callback - Callback where to receive the message
 */
function onMessage(channel, callback) {
    if (typeof channel !== "string") throw new Error("Invalid channel name");
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    if (channel in callbacks) throw new Error("This channel is already registered");
    callbacks[channel] = callback;
}

/**
 * Remember a user identified by an identifier
 * @param {string} identifier - User identifier
 * @param {WebSocket} ws - Websocket client instance
 */
function addUser(identifier, ws) {
    users[identifier] = ws;
}

/**
 * Add a user to a group
 * @param {string} identifier - group identifier
 * @param {WebSocket} ws - Websocket client instance
 */
function addToGroup(identifier, ws) {
    if (!groups[identifier]) groups[identifier] = [];
    groups[identifier].push(ws);
}

/**
 * Delete a user by identifier
 * @param {string} identifier - User identifier
 */
function deleteUser(identifier) {
    delete users[identifier];
}

/**
 * Delete a group by identifier
 * @param {string} identifier - Group identifier
 */
function deleteGroup(identifier) {
    delete groups[identifier];
}

/**
 * Set the callback to call when a new user is connected
 * @param {onConnectionCallback} callback - Callback where to receive new user connection
 */
function onConnection(callback) {
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    if (config.onConnectionCallback) throw new Error("onConnectionCallback is already defined");
    config.onConnectionCallback = callback;
}

/**
 * Set the callback to validate authenticationToken
 * @param {checkAuthenticationCallback} callback - Function where you can validate the authenticationToken
 */
function checkAuthentication(callback) {
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    if (config.checkAuthenticationCallback)
        throw new Error("Authentication Callback is already defined");
    config.checkAuthenticationCallback = callback;
}

/**
 * Set the callback where to be notified when user close the connection
 * @param {onClientClosedCallback} callback - Callback where to be notified when user close the connection
 */
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
