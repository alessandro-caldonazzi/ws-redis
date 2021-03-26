let callbacks = {};
let checkAuthenticationCallback;
let users = {};
let groups = {};

function onMessage(channel, callback) {
    if (typeof channel !== "string") throw new Error("Invalid channel name");
    if (typeof callback !== "function")
        throw new Error("Callback must be a function");
    if (channel in callbacks)
        throw new Error("This channel is already registered");
    callbacks[channel] = callback;
}

function sendMessage(channel, data) {}

async function handleMessage(json, ws) {
    if (json?.token && checkAuthenticationCallback) {
        const isAuthenticated = await checkAuthenticationCallback(json.token);
        if (!isAuthenticated) return;
    }
    if (json?.channel in callbacks && json.data) {
        callbacks[channel](json.data, ws);
    }
}

function checkAuthentication(callback) {
    if (typeof callback !== "function")
        throw new Error("Callback must be a function");
    if (checkAuthenticationCallback)
        throw new Error("Authentication Callback is already defined");
    checkAuthenticationCallback = callback;
}

function addUser(identifier, ws) {
    users[identifier] = ws;
}

function addGroup(identifier, ws) {
    groups[identifier] = ws;
}

function deleteUser(identifier) {
    delete users[identifier];
}

function deleteGroup(identifier) {
    delete groups[identifier];
}

module.exports = {
    onMessage,
    sendMessage,
    checkAuthentication,
    addUser,
    addGroup,
    deleteUser,
    deleteGroup,
};
