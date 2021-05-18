// Server

/**
 * Callback where to receive new user connection
 * @callback onConnectionCallback
 * @param {WebSocket} ws - Websocket client instance, useful if you want to add the user to a group
 * @param {*} token - User authenticationToken set on client side
 */

/**
 * Callback where to receive message specific to a channel
 * @callback onMessageCallbackServer
 * @param {Object} message - Json object containing the message and the authenticationToken
 * @param {*} message.authenticationToken - The authenticationToken set on client side
 * @param {*} message.data - Data sent by client
 * @param {WebSocket} ws - Websocket client instance, useful if you want to add the user to a group
 */

/**
 * Function where you can validate the authenticationToken
 * @callback checkAuthenticationCallback
 * @param {*} token - User authenticationToken set on client side
 * @return {boolean|Promise<boolean>} true means the token is valid
 */

/**
 * Callback where to be notified when user close the connection
 * @callback onClientClosedCallback
 * @param {string} userIdentifier - Identifier of the user
 * @param {String[]} groups - List of groups in which the user was present
 */

// Client

/**
 * Callback where to receive message specific to a channel
 * @callback onMessageCallbackClient
 * @param {*} data - Data sent by server
 */
