const exposedMethods = require("./exposedMethods");

async function handleMessage(json, ws) {
    if (json?.token && checkAuthenticationCallback) {
        const isAuthenticated = await checkAuthenticationCallback(json.token);
        if (!isAuthenticated) return;
    }
    if (json?.channel in callbacks && json.data) {
        callbacks[channel](json.data, ws);
    }
}

module.exports = {
    ...exposedMethods,
};
