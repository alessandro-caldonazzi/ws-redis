# ws-redis

[![Build Status](https://travis-ci.com/alessandro-caldonazzi/ws-redis.svg?branch=master)](https://travis-ci.com/alessandro-caldonazzi/ws-redis)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/7ac8961bfefb4a4fa6292f2519186317)](https://www.codacy.com/gh/alessandro-caldonazzi/ws-redis/dashboard?utm_source=github.com&utm_medium=referral&utm_content=alessandro-caldonazzi/ws-redis&utm_campaign=Badge_Grade)

Node.js module that simplifies websocket usage introducing channels, groups and tracking users.

Also, it allows you to use redis as a publish - subscribe for websocket message delivery.

It is divided into a server library and a client library

## Complete Docs

In this readme you will find an introduction, you can read the specific documentation [here](https://ws-redis.netlify.app/)

## Server Library

### Installation

```sh
npm i ws-redis
```

```js
const wsRedis = require("ws-redis");
const ws = require("ws");

wsRedis.init(new ws.Server({ port: 8080 }));
```

### [onConnection](https://ws-redis.netlify.app/module-Server.html#~onConnection)

Sets the callback to be called when a user logs on

```js
wsRedis.onConnection((wsInstance, authenticationToken) => {
    //authenticationToken is a optional token set by client,
    //if present, it means that the user has already been authenticated, so there is no need to check the authenticationToken here.
});
```

### [Handle authentication](https://ws-redis.netlify.app/module-Server.html#~checkAuthentication)

Sets a callback to validate the authenticationToken set by the client (optional).

The callback you set must return true if the authenticationToken is valid, and can be an async function.

```js
wsRedis.checkAuthentication((authenticationToken) =>{
    if(/* authenticationToken is valid */){
        return true;
    }
    return false;
});
```

### [Identify users and groups](https://ws-redis.netlify.app/module-Server.html#~addToGroup)

You can identify a user with a string at any time, for example during connection.

```js
wsRedis.onConnection((wsInstance, authenticationToken) => {
    wsRedis.addUser("userName", wsInstance);
    //from now on you can refer to the user by his identifier
});
```

You can also group users into groups, e.g. to send a broadcast message to all of them.

```js
wsRedis.onConnection((wsInstance, authenticationToken) => {
    wsRedis.addToGroup("groupName", wsInstance);
});
```

### [Handle messages](https://ws-redis.netlify.app/module-Server.html#~onMessage)

Messages are sent/received on channels, you have to manage messages coming from different channels separately.

```js
wsRedis.onMessage("channelName", (message, wsInstance, userIdentifier) => {
    console.log(message);
    //wsInstance can be used to add the user to a group for example

    //If you have added the user with the addUser() method, userIdentifier will show you the identifier of the user who sent the message
    console.log(userIdentifier); //identifier set in addUser()
});
```

### [Send message to user](https://ws-redis.netlify.app/module-Server.html#~sendMessageToUser)

To send a message you have to specify the user identifier (set in addUser()), the channel and the message to be sent, you can also pass a JSON

```js
wsRedis.sendMessageToUser("userName", "channelName", "data I want to send");
```

If you have set up redis, in case the specified user is not on this node server, it will be sent from the node instance that owns that user

### [Send message to group](https://ws-redis.netlify.app/module-Server.html#~sendMessageToGroup)

```js
wsRedis.sendMessageToGroup("groupName", "channelName", "data I want to send");
```

### [Handle client closed connection](https://ws-redis.netlify.app/module-Server.html#~onClientClosed)

When a client disconnects with the close() method or due to connection problems, a callback (if set) is called on the server to notify you of the incident

```js
wsRedis.onClientClosed((userIdentifier, groups) => {
    //userIdentifier of the disconnected user
    //groups is a string Array, contains the identifier of the groups in which the user participated
});
```

## [Client:](https://ws-redis.netlify.app/WsClient.html)

The client can be used either on node with the ws library or on a browser.
If you are on browser you can include it from cdn:

```html
<script
    src="https://cdn.jsdelivr.net/gh/alessandro-caldonazzi/ws-redis/src/client/client.js"
    defer
></script>
```

### Initiate

If you are on browser use WebSocket

```js
const connection = new WsClient({
    url: "ws://x.y:8080",
    websocket: WebSocket,
});
connection.connect();
```

If you are on nodejs use the ws library

```js
const WebSocket = require("ws");
const connection = new WsClient({
    url: "ws://x.y:8080",
    websocket: WebSocket,
    authenticationToken: "jwt for example", // this is optional, use this if you need authentication (remember to set the checkAuthentication callback on server)
});
connection.connect();
```

### [connect](https://ws-redis.netlify.app/WsClient.html#connect)

To start the ws connection you need to call `connect()`
Returns a promise, if you need to wait for a successful connection with await

```js
connection.connect();
```

```js
await connection.connect();
```

### [Handle message](https://ws-redis.netlify.app/WsClient.html#onMessage)

```js
connection.onMessage("channelName", (data) => {
    console.log(data);
});
```

### [Send message to server](https://ws-redis.netlify.app/WsClient.html#send)

```js
connection.send("channelName", "your data");
```

Data can be JSON

### [onConnectionFailure](https://ws-redis.netlify.app/WsClient.html#onConnectionFailure)

Set a callback to be notified when connection fail (for example connection instability)

```js
connection.onConnectionFailure(() => {
    console.warn("connection lost");
});
```

### [onConnectionReestablished](https://ws-redis.netlify.app/WsClient.html#onConnectionReestablished)

Set a callback to be notified when the connection is re-established

```js
connection.onConnectionReestablished(() => {
    console.log("connection re-established");
});
```
