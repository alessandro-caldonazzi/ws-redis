/**
 * Class rapresenting the client connection
 */
class WsClient {
    /**
     * @param {Object} option
     * @param {Url} option.url - Url to websocket server (ws://x.x)
     * @param {WebSocket=} option.websocket - Class rapresent the websocket connection, if you are on nodejs use ws otherwise leave blank
     * @param {*=} authenticationToken - If you want to authenticate the user set this and validate it on server
     */
    constructor({ url, websocket = null, authenticationToken = null }) {
        if (!websocket) websocket = WebSocket;
        if (authenticationToken) this.authenticationToken = authenticationToken;
        /** @private */
        this.config = {
            websocket,
            url,
        };
        /** @private */
        this.callbacks = {};
        /** @private */
        this.intervalCheckAcknowledge = setInterval(() => this.checkAcknowledge(this), 2000);
        /** @private */
        this.isAlive = true;
        this._createConnection();
    }

    /**
     * Start ws connection, you need to call this method to make a connection
     * @return {Promise} resolve the promise when the connection is established
     */
    async connect() {
        return new Promise((resolve) => {
            if (this.getReadyState() == 1) {
                this.send(null, "connection");
                if (!this.isAlive) {
                    this.isAlive = true;
                    this.config.onConnectionReestablished?.();
                }
            } else
                this.connection.onopen = (e) => {
                    this.send(null, "connection");
                    if (!this.isAlive) {
                        this.isAlive = true;
                        this.config.onConnectionReestablished?.();
                    }
                    resolve(true);
                };
        });
    }

    /**
     * Send message to server
     * @param {string} channel - Channel name (server need to listen on it with onMessage() )
     * @param {*} data - Data to be sent
     */
    async send(channel, data) {
        let message = { data, channel };
        if (this.authenticationToken) message.token = this.authenticationToken;
        if (!this.totMessage++) message.isInitial = true;
        if (!this.connection.readyState) await waitConnection(this.connection);
        await this.connection.send(JSON.stringify(message));
    }

    /**
     * use this to change your authenticationToken
     */
    setAuthenticationToken(authenticationToken) {
        this.authenticationToken = authenticationToken;
        this.send("reservedChannelWs", {
            action: "setAuthenticationToken",
            token: this.authenticationToken,
        });
    }

    getAuthenticationToken() {
        return this.authenticationToken;
    }

    /**
     * @return {Number} Total number of message sent
     */
    getTotMessages() {
        return this.totMessage - 1;
    }

    /**
     * Set the callback to call when the user receive a message
     * @param {string} channel - Channel name to listen to
     * @param {onMessageCallbackClient} callback - Callback where to receive the message
     */
    onMessage(channel, callback) {
        if (typeof channel !== "string") throw new Error("Invalid channel name");
        if (typeof callback !== "function") throw new Error("Callback must be a function");
        if (channel in this.callbacks) throw new Error("This channel is already registered");
        this.callbacks[channel] = callback;
    }

    /**
     * Set the callback to call when the connection goes down
     * @param {function} callback - zero parameter function called when connection is down
     */
    onConnectionFailure(callback) {
        if (typeof callback !== "function") throw new Error("Callback must be a function");
        this.config.onConnectionFailure = callback;
    }

    /**
     * Set the callback to call when the connection comes back online
     * @param {function} callback - zero parameter function called when the connection comes back online
     */
    onConnectionReestablished(callback) {
        if (typeof callback !== "function") throw new Error("Callback must be a function");
        this.config.onConnectionReestablished = callback;
    }

    /**
     * @private
     */
    handleMessage({ data }) {
        if (data === "ping") return this._sendHeartbeat("pong");
        if (data === "ack") return (this.lastAcknowledge = new Date().getTime());
        data = JSON.parse(data);
        if (data?.channel in this.callbacks && data.data) {
            this.callbacks[data.channel](data.data);
        }
    }

    async close() {
        await this.send("reservedChannelWs", { action: "close" });
        this.connection.close();
    }

    getReadyState() {
        return this.connection.readyState;
    }

    /**
     * @private
     */
    checkAcknowledge(self) {
        if (new Date().getTime() - 5000 > self.lastAcknowledge || !self.lastAcknowledge) {
            // two ack packets were lost
            if (self.isAlive) {
                self.isAlive = false;
                self.config.onConnectionFailure?.();
            }
            self._createConnection();
            this.connect();
            console.log("Connection problem");
        }
    }

    /**
     * @private
     */
    async _createConnection() {
        /** @private */
        this.connection = new this.config.websocket(this.config.url);
        this.connection.onerror = () => {};
        this.connection.onmessage = (message) => {
            this.handleMessage(message);
        };
        /** @private */
        this.totMessage = 0;
    }

    /**
     * @private
     */
    async _sendHeartbeat(data) {
        if (!this.connection.readyState) await waitConnection(this.connection);
        this.connection.send(data);
    }
}

/**
 * @private
 */
async function waitConnection(connection) {
    return new Promise((resolve, reject) => {
        let i = 0;
        const listener = setInterval(() => {
            if (connection.readyState) {
                resolve(true);
                return clearInterval(listener);
            }
            if (++i > 20) throw new Error("Cannot send");
        }, 10);
    });
}

module.exports = WsClient;
