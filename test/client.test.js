const WsClient = require("../src/client/client");
const WebSocket = require("ws");
const wsRedis = require("../src/index");
let connection;

test("setIdentifier", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
    connection.setAuthenticationToken("foo");
    expect(connection.authenticationToken).toBe("foo");
});

test("getTotMessages", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
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

    connection.onMessage("testChannel", (message) => {
        console.log("arrivato");
        expect(message).toBe("testMessage");
        done();
    });
});

test("provide invalid parameters in onMessage", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    connection = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });
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
});

test("send/receive on group", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    let connectedUsers = 0,
        arrivedMessages = 0;
    wsRedis.onConnection((ws, authenticationToken) => {
        connectedUsers++;
        //add all connected user to testGroup
        wsRedis.addToGroup("testGroup", ws);
        if (connectedUsers === 2)
            wsRedis.sendMessageToGroup(
                "testGroup",
                "testChannel",
                "testMessage"
            );
    });

    //connect two users
    const connUser1 = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });

    const connUser2 = new WsClient({
        url: "ws://localhost:8080",
        websocket: WebSocket,
    });

    connUser1.onMessage("testChannel", (message) => {
        expect(message).toBe("testMessage");
        //after the last message is received, test is done
        arrivedMessages++;
        if (arrivedMessages === 2) done();
    });

    connUser2.onMessage("testChannel", (message) => {
        expect(message).toBe("testMessage");
        //after the last message is received, test is done
        arrivedMessages++;
        if (arrivedMessages === 2) done();
    });
});

afterEach(() => {
    wsRedis.close();
    wsRedis.clean();
    try {
        connection.close();
    } catch (error) {}
});

module.exports = {
    connect: () => {
        const connection = new WsClient({
            url: "ws://localhost:8080",
            websocket: WebSocket,
            authenticationToken: "authenticationToken",
        });
        setTimeout(() => connection.close(), 100);
    },
    sendMessageToChannel: async () => {
        const connection = new WsClient({
            url: "ws://localhost:8080",
            websocket: WebSocket,
            authenticationToken: "authenticationToken",
        });
        await connection.send("testChannel", "testMessage");
        await connection.send("testChannel", "testMessage");
        connection.close();
    },
};
