const wsRedis = require("../src/index");
const WebSocket = require("ws");
const client = require("./client.test");

test("authentication", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    client.connect();
    wsRedis.checkAuthentication((identifier) => {
        //check if identifier is valid
        expect(identifier).toBe("clientIdentifier");
        done();
        return true;
    });
    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

test("onConnection", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    client.connect();
    wsRedis.onConnection((ws, identifier) => {
        expect(identifier).toBe("clientIdentifier");
        done();
    });
});

test("receive message on channel", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    client.sendMessageToChannel();

    wsRedis.onMessage("testChannel", (data, ws) => {
        expect(data.message).toBe("testMessage");
        done();
    });
    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

afterEach(() => {
    wsRedis.close();
    wsRedis.clean();
});
