const WsClient = require("../src/client/client");
const WebSocket = require("ws");
const wsRedis = require("../src/index");
let connection;

test("setIdentifier", () => {
    try {
        wsRedis.init(new WebSocket.Server({ port: 8080 }));

        connection = new WsClient({
            url: "ws://localhost:8080",
            websocket: WebSocket,
        });
        connection.setAuthenticationToken("foo");
        expect(connection.authenticationToken).toBe("foo");
    } catch (error) {}
});

test("getTotMessages", () => {
    try {
        wsRedis.init(new WebSocket.Server({ port: 8080 }));

        connection = new WsClient({
            url: "ws://localhost:8080",
            websocket: WebSocket,
        });
        expect(connection.getTotMessages()).toBe(0);
    } catch (error) {}
});

test("send/receive on channel", (done) => {
    try {
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
    } catch (error) {
        console.log(error);
    }
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
