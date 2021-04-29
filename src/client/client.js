class WsClient {
    constructor({ url, websocket = null, authenticationToken = null }) {
        if (!websocket) websocket = WebSocket;
        if (authenticationToken) this.authenticationToken = authenticationToken;

        this.url = url;
        this.connection = new websocket(url);
        this.connection.onmessage = this.handleMessage;
        this.totMessage = 0;
        this.callbacks = {};
    }

    async connect() {
        return new Promise((resolve, reject) => {
            if (this.getReadyState() == 1) this.send(null, "connection");
            else
                this.connection.onopen = (e) => {
                    this.send(null, "connection");
                    resolve(true);
                };
        });
    }

    async send(channel, data) {
        let message = { data, channel };
        if (this.authenticationToken) message.token = this.authenticationToken;
        if (!this.totMessage++) message.isInitial = true;
        if (!this.connection.readyState) await waitConnection(this.connection);
        await this.connection.send(JSON.stringify(message));
    }

    setAuthenticationToken(authenticationToken) {
        this.authenticationToken = authenticationToken;
        this.send("reservedChannelWs", {
            action: "setAuthenticationToken",
            token: this.authenticationToken,
        });
    }

    getTotMessages() {
        return this.totMessage - 1;
    }

    onMessage(channel, callback) {
        if (typeof channel !== "string") throw new Error("Invalid channel name");
        if (typeof callback !== "function") throw new Error("Callback must be a function");
        if (channel in this.callbacks) throw new Error("This channel is already registered");
        this.callbacks[channel] = callback;
    }

    handleMessage = ({ data }) => {
        data = JSON.parse(data);
        if (data?.channel in this.callbacks && data.data) {
            this.callbacks[data.channel](data.data);
        }
    };

    async close() {
        await this.send("reservedChannelWs", { action: "close" });
        this.connection.close();
    }

    getReadyState() {
        return this.connection.readyState;
    }
}

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
