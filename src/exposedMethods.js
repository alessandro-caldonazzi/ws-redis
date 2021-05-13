/**
 * @module Server
 */

let { callbacks, users, groups, config } = require("./handling");

/**
 * Callback where to receive message specific to a channel
 * @callback onMessageCallback
 * @param {Object} message - Json object containing the message and the authenticationToken
 * @param {*} message.authenticationToken - The authenticationToken set on client side
 * @param {*} message.data - Data sent by client
 * @param {WebSocket} ws - Websocket client instance, useful if you want to add the user to a group
 */

/**
 * Set the callback to call when the user receive a message
 * @param {string} channel - Channel name to listen to
 * @param {onMessageCallback} callback - Callback where to receive the message
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
 * Callback where to receive new user connection
 * @callback onConnectionCallback
 * @param {WebSocket} ws - Websocket client instance, useful if you want to add the user to a group
 * @param {*} token - User authenticationToken set on client side
 */

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
 * Function where you can validate the authenticationToken
 * @callback checkAuthenticationCallback
 * @param {*} token - User authenticationToken set on client side
 * @return {boolean|Promise<boolean>} true means the token is valid
 */

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
 * Callback where to be notified when user close the connection
 * @callback onClientClosedCallback
 * @param {string} userIdentifier - Identifier of the user
 * @param {String[]} groups - List of groups in which the user was present
 */

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
