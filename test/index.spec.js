/* eslint-disable */
const wsRedis = require("../src/index");
const WebSocket = require("ws");
const client = require("./client.test");
const Redis = require("ioredis");

test("authentication", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    client.sendMessageToChannel();
    wsRedis.checkAuthentication((authenticationToken) => {
        //check if authenticationToken is valid
        expect(authenticationToken).toBe("authenticationToken");
        done();
        return true;
    });
    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

test("authentication fails", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    client.sendMessageToChannel();
    wsRedis.checkAuthentication((authenticationToken) => {
        //check if authenticationToken is valid
        expect(authenticationToken).toBe("authenticationToken");
        done();
        return false;
    });
    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

test("onConnection", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    client.connect();
    wsRedis.onConnection((ws, authenticationToken) => {
        expect(authenticationToken).toBe("authenticationToken");
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

test("provide no callback to onMessage", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    expect(() => {
        wsRedis.onMessage("testChannel", "this should not work");
    }).toThrow(Error);

    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

test("provide same channel multiple times to onMessage", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    wsRedis.onMessage("testChannel", (data, ws) => {});

    expect(() => {
        wsRedis.onMessage("testChannel", (data, ws) => {});
    }).toThrow(Error);

    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

test("provide no callback to onConnection", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    expect(() => {
        wsRedis.onConnection("this should not work");
    }).toThrow(Error);
});

test("provide duplicate callback to onConnection", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    wsRedis.onConnection(() => {});
    expect(() => {
        wsRedis.onConnection(() => {});
    }).toThrow(Error);
});

test("provide no callback to checkAuthentication", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    expect(() => {
        wsRedis.checkAuthentication("this should not work");
    }).toThrow(Error);
});

test("provide duplicate callback to checkAuthentication", () => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    wsRedis.checkAuthentication(() => {});
    expect(() => {
        wsRedis.checkAuthentication(() => {});
    }).toThrow(Error);
});

test("provide invalid WebSocket instance to init", () => {
    expect(() => {
        wsRedis.init("this is not a valid WebSocket instance");
    }).toThrow(Error);
});

test("provide invalid json to isJson", () => {
    const isJson = require("../src/utils").isJson;
    expect(isJson("this is not a valid Json")).toBe(false);
});

test("redis pub test sending to user", (done) => {
    const redisConnection = new Redis();
    redisConnection.on("connect", () => {
        redisConnection.on("message", (channel, message) => {
            message = JSON.parse(message);
            expect(message.identifier).toBe("userOnAnotherNodeInstance");
            expect(message.channel).toBe("channel");
            expect(message.data).toBe("data");
            expect(message.isGroup).toBe(false);
            done();
            redisConnection.disconnect();
        });
        redisConnection.subscribe("ws-redis");
        wsRedis.sendMessageToUser(
            "userOnAnotherNodeInstance",
            "channel",
            "data"
        );
    });
});

test("redis pub test sending to group", (done) => {
    const redisConnection = new Redis();
    redisConnection.on("connect", () => {
        redisConnection.on("message", (channel, message) => {
            message = JSON.parse(message);
            expect(message.identifier).toBe("groupAvailableOnAnotherNode");
            expect(message.channel).toBe("channel");
            expect(message.data).toBe("data");
            expect(message.isGroup).toBe(true);
            done();
            redisConnection.disconnect();
        });
        redisConnection.subscribe("ws-redis");
        wsRedis.sendMessageToGroup(
            "groupAvailableOnAnotherNode",
            "channel",
            "data"
        );
    });
});

afterEach(async () => {
    await wsRedis.close();
    wsRedis.clean();
});

afterAll(() => {
    //redis.quit();
});
