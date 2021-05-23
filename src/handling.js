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
        callbacks[json.channel]({ authenticationToken: json.token, data: json.data }, ws);
    }
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
        deleteUserByConnection(ws);
    }
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

function deleteUserByConnection(ws) {
    const userIdentifier = getUserIdentifier(ws);
    const userGroups = getGroupsByConnection(ws);

    if (userIdentifier) delete users[userIdentifier];
    for (const groupId of userGroups) {
        groups[groupId] = groups[groupId].filter((userWs) => userWs != ws);
    }
    ws.terminate();

    if (userIdentifier || userGroups.length != 0)
        config.onConnectionClosed?.(userIdentifier, userGroups);
}

function pingPong(websocket) {
    websocket.clients.forEach((ws) => {
        if (!ws.isAlive) {
            deleteUserByConnection(ws);
        }
        ws.isAlive = false;
        ws.send("ping");
    });
}

module.exports = {
    callbacks,
    config,
    users,
    groups,
    handleMessage,
    clean,
    pingPong,
    deleteUserByConnection,
};
