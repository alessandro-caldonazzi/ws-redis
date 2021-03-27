let callbacks = {};
let config = {};
let users = {};
let groups = {};

async function handleMessage(json, ws) {
    if (json?.token && config.checkAuthenticationCallback) {
        const isAuthenticated = await config.checkAuthenticationCallback(
            json.token
        );
        if (!isAuthenticated) return;
    }
    if (json?.channel in callbacks && json.data) {
        callbacks[json.channel](
            { identifier: json.token, message: json.data },
            ws
        );
    }
}

function onConnection(callback) {
    if (typeof callback !== "function")
        throw new Error("Callback must be a function");
    if (config.onConnectionCallback)
        throw new Error("onConnectionCallback is already defined");
    config.onConnectionCallback = callback;
}

function checkAuthentication(callback) {
    if (typeof callback !== "function")
        throw new Error("Callback must be a function");
    if (config.checkAuthenticationCallback)
        throw new Error("Authentication Callback is already defined");
    config.checkAuthenticationCallback = callback;
}

module.exports = {
    callbacks,
    config,
    users,
    groups,
    handleMessage,
    onConnection,
    checkAuthentication,
};
