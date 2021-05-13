/* eslint-disable */
const WsClient = require("../src/client/client");
const WebSocket = require("ws");
const wsRedis = require("../src/index");
const Redis = require("ioredis");
let connection;

test("setAuthenticationToken", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    wsRedis.onConnection((ws, authenticationToken) => {
        wsRedis.addUser(authenticationToken, ws);
        if (authenticationToken == "foo") done();
    });

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
        authenticationToken: "initialToken",
    });
    connection.connect();

    connection.setAuthenticationToken("foo");

    expect(connection.authenticationToken).toBe("foo");
});

test("getTotMessages", async () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });

    await connection.connect();

    expect(connection.getTotMessages()).toBe(0);
});

test("send/receive on channel", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    wsRedis.onConnection((ws, authenticationToken) => {
        wsRedis.addUser("testUser", ws);
        wsRedis.sendMessageToUser("testUser", "testChannel", "testMessage");
    });

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
    connection.connect();

    connection.onMessage("testChannel", (message) => {
        expect(message).toBe("testMessage");
        done();
    });
});

test("provide invalid parameters in onMessage", async (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    wsRedis.onConnection(() => {});

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
    await connection.connect();
    expect(() => {
        connection.onMessage(123, (message) => {});
    }).toThrow(Error);

    expect(() => {
        connection.onMessage("validChannelName", "invalidCallback");
    }).toThrow(Error);

    connection.onMessage("duplicateChannel", () => {});
    expect(() => {
        connection.onMessage("duplicateChannel", () => {});
    }).toThrow(Error);
    done();
});

test("send/receive on group", async (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    let connectedUsers = 0,
        arrivedMessages = 0;
    wsRedis.onConnection((ws, authenticationToken) => {
        connectedUsers++;
        //add all connected user to testGroup
        wsRedis.addToGroup("testGroup", ws);
        if (connectedUsers === 2) {
            wsRedis.sendMessageToGroup("testGroup", "testChannel", "testMessage");
        }
    });

    //connect two users
    const connUser1 = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
        authenticationToken: "a",
    });

    const connUser2 = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
        authenticationToken: "b",
    });

    function _onMessage(message) {
        expect(message).toBe("testMessage");
        //after the last message is received, test is done
        arrivedMessages++;
        if (arrivedMessages === 2) {
            done();
            connUser1.close();
            connUser2.close();
        }
    }
    connUser1.onMessage("testChannel", _onMessage);
    connUser2.onMessage("testChannel", _onMessage);

    connUser1.connect();
    connUser2.connect();
});

test("redis sub test (user)", async (done) => {
    await wsRedis.init(new WebSocket.Server({ port: 8080 }));
    wsRedis.onConnection((ws, authenticationToken) => {
        wsRedis.addUser("testUser", ws);
    });

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
    await connection.connect();

    const redisConnection = new Redis();
    redisConnection.on("connect", () => {
        redisConnection.publish(
            "ws-redis",
            JSON.stringify({
                identifier: "testUser",
                channel: "testChannel",
                data: "testMessage",
                isGroup: false,
                pid: 123,
            })
        );
    });

    connection.onMessage("testChannel", (message) => {
        expect(message).toBe("testMessage");
        done();
    });
});

test("redis sub test (group)", async (done) => {
    await wsRedis.init(new WebSocket.Server({ port: 8080 }));
    wsRedis.onConnection((ws, authenticationToken) => {
        wsRedis.addToGroup("testGroup", ws);
    });

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
    await connection.connect();

    const redisConnection = new Redis();
    redisConnection.on("connect", () => {
        redisConnection.publish(
            "ws-redis",
            JSON.stringify({
                identifier: "testGroup",
                channel: "testChannel",
                data: "testMessage",
                isGroup: true,
            })
        );
    });

    connection.onMessage("testChannel", (message) => {
        expect(message).toBe("testMessage");
        done();
    });
});

test("client close connection", async (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    wsRedis.onConnection((ws, authenticationToken) => {
        wsRedis.addUser("testUser", ws);
    });

    wsRedis.onClientClosed((identifier, groups) => {
        expect(identifier).toBe("testUser");
        expect(groups.length).toBe(0);
        done();
    });

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
    await connection.connect();
    connection.close();
});

afterEach(async () => {
    await wsRedis.close();
    wsRedis.clean();
    if (connection?.getReadyState()) {
        await connection.close();
    }
    return new Promise((resolve, reject) => {
        setTimeout(resolve, 10);
    });
});
