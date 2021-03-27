class WsClient {
    constructor({ url, websocket = null, identifier = null }) {
        if (!websocket) websocket = WebSocket;
        if (identifier) this.identifier = identifier;

        this.url = url;
        this.connection = new websocket(url);
        this.connection.onmessage = this._handleMessage;
        this.totMessage = 0;
        this.callbacks = {};
        this.send(null, "connection");
    }

    async send(channel, data) {
        let message = { data, channel };
        if (this.identifier) message.token = this.identifier;
        if (!this.totMessage++) message.isInitial = true;
        if (!this.connection.readyState) await waitConnection(this.connection);

        this.connection.send(JSON.stringify(message));
    }

    setIdentifier(identifier) {
        this.identifier = identifier;
    }

    getTotMessage() {
        return this.totMessage;
    }

    onMessage(channel, callback) {
        if (typeof channel !== "string")
            throw new Error("Invalid channel name");
        if (typeof callback !== "function")
            throw new Error("Callback must be a function");
        if (channel in this.callbacks)
            throw new Error("This channel is already registered");
        this.callbacks[channel] = callback;
    }

    _handleMessage = ({ data }) => {
        if (data?.channel in this.callbacks && data.data) {
            this.callbacks[channel](data.data, ws);
        }
    };
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
