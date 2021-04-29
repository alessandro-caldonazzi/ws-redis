let callbacks = {};
let config = {};
let users = {};
let groups = {};

async function handleMessage(json, ws) {
    if (json?.token && config.checkAuthenticationCallback) {
        const isAuthenticated = await config.checkAuthenticationCallback(json.token);
        if (!isAuthenticated) return;
    }
    if (json?.channel == "reservedChannelWs") {
        reservedChannelHandle(ws, json.data);
    }
    if (json?.channel in callbacks && json.data) {
        callbacks[json.channel]({ authenticationToken: json.token, message: json.data }, ws);
    }
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

function clean() {
    for (let member in callbacks) delete callbacks[member];
    for (let member in config) delete config[member];
    for (let member in users) delete users[member];
    for (let member in groups) delete groups[member];
}

function reservedChannelHandle(ws, data) {
    if (data.action == "setAuthenticationToken") {
        //user has changed authenticationToken, remove connection
        for (let identifier in users) {
            if (users[identifier] == ws) {
                delete users[identifier];
            }
        }
        for (const key in groups) {
            groups[key] = groups[key].filter((userWs) => userWs != ws);
        }

        config.onConnectionCallback(ws, data.token);
    } else if (data.action == "close") {
        let userIdentifier = getUserIdentifier(ws);
        let userGroups = getGroupsByConnection(ws);
        config.onConnectionClosed?.(userIdentifier, userGroups);
    }
}

function onClientClosed(callback) {
    if (typeof callback !== "function") throw new Error("Callback must be a function");
    config.onConnectionClosed = callback;
}

function getUserIdentifier(ws) {
    for (const identifier in users) {
        if (users[identifier] == ws) return identifier;
    }
}

function getGroupsByConnection(ws) {
    let userGroups = [];
    for (const identifier in groups) {
        for (const userWs of groups[identifier]) {
            if (userWs == ws) userGroups.push(identifier);
        }
    }
    return userGroups;
}

function pingPong(websocket) {
    console.log(websocket.clients.size);
    console.log(Object.keys(users), Object.keys(groups));
    websocket.clients.forEach((ws) => {
        if (!ws.isAlive) {
            const userIdentifier = getUserIdentifier(ws);
            const userGroups = getGroupsByConnection(ws);

            if (userIdentifier) delete users[userIdentifier];
            for (const groupId of userGroups) {
                groups[groupId] = groups[groupId].filter((userWs) => userWs != ws);
            }
            console.log(groups, users);
            return ws.terminate();
        }
        ws.isAlive = false;
        console.log("ping...");
        ws.ping();
    });
}

module.exports = {
    callbacks,
    config,
    users,
    groups,
    handleMessage,
    onConnection,
    checkAuthentication,
    clean,
    onClientClosed,
    pingPong,
};
