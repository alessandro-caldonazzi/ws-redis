/* eslint-disable */
const wsRedis = require("../src/index");
const WebSocket = require("ws");
const client = require("./client.test");
const Redis = require("ioredis");
const WsClient = require("../src/client/client");

test("authentication", async (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    clientSimulator.sendMessageToChannel();
    wsRedis.checkAuthentication((authenticationToken) => {
        //check if authenticationToken is valid
        expect(authenticationToken).toBe("authenticationToken");
        done();
        return true;
    });
    //required but not interested in this test
    wsRedis.onConnection(() => {});
});

test("authentication fails", async (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    clientSimulator.sendMessageToChannel();
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
    wsRedis.onConnection((ws, authenticationToken) => {
        expect(authenticationToken).toBe("authenticationToken");
        done();
    });
    clientSimulator.connect();
});

test("receive message on channel", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));
    clientSimulator.sendMessageToChannel();

    wsRedis.onMessage("testChannel", (message, ws) => {
        expect(message.data).toBe("testMessage");
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
    expect(wsRedis.init("this is not a valid WebSocket instance")).rejects.toEqual(
        "wsInstance must be a WebSocket instance"
    );
});

test("provide invalid json to isJson", () => {
    const isJson = require("../src/utils").isJson;
    expect(isJson("this is not a valid Json")).toBe(false);
});

test("redis pub test sending to user", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    const redisConnection = new Redis();
    redisConnection.on("connect", async () => {
        redisConnection.on("message", (channel, message) => {
            message = JSON.parse(message);
            if (message.data != "testToUser") {
                return; //avoid other messages
            }
            expect(message.identifier).toBe("userOnAnotherNodeInstance");
            expect(message.channel).toBe("channel");
            expect(message.isGroup).toBe(false);
            done();
            redisConnection.disconnect();
        });
        await redisConnection.subscribe("ws-redis");
        wsRedis.sendMessageToUser("userOnAnotherNodeInstance", "channel", "testToUser");
    });
});

test("redis pub test sending to group", (done) => {
    wsRedis.init(new WebSocket.Server({ port: 8080 }));

    const redisConnection = new Redis();
    redisConnection.on("connect", async () => {
        redisConnection.on("message", (channel, message) => {
            message = JSON.parse(message);
            if (message.data != "testToGroup") {
                return; //avoid other messages
            }
            expect(message.identifier).toBe("groupAvailableOnAnotherNode");
            expect(message.channel).toBe("channel");
            expect(message.isGroup).toBe(true);
            done();
            redisConnection.disconnect();
        });
        await redisConnection.subscribe("ws-redis");
        wsRedis.sendMessageToGroup("groupAvailableOnAnotherNode", "channel", "testToGroup");
    });
});

afterEach(async () => {
    await wsRedis.close();
    wsRedis.clean();
    return new Promise((resolve, reject) => {
        setTimeout(resolve, 10);
    });
});

afterAll(() => {
    //redis.quit();
});
const clientSimulator = {
    connect: () => {
        setTimeout(async () => {
            const conn = new WsClient({
                url: "ws://localhost:8080",
                websocket: WebSocket,
                authenticationToken: "authenticationToken",
            });
            await conn.connect();
            conn.close();
        }, 10);
    },
    sendMessageToChannel: () => {
        setTimeout(async () => {
            const conn = new WsClient({
                url: "ws://localhost:8080",
                websocket: WebSocket,
                authenticationToken: "authenticationToken",
            });
            await conn.connect();
            await conn.send("testChannel", "testMessage");
            await conn.send("testChannel", "testMessage");
            conn.close();
        }, 10);
    },
};
