"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.elasticsearchBuilderCollection = exports.ClassBuilderPattern = void 0;
const elasticsearch_module_1 = require("./elasticsearch.module");
class ClassBuilderPattern {
    toPlainObject() {
        return Object.getOwnPropertyNames(this).reduce((obj, key) => {
            obj[key] = this[key];
            return obj;
        }, {});
    }
}
exports.ClassBuilderPattern = ClassBuilderPattern;
class ClientUri extends ClassBuilderPattern {
    constructor(uri) {
        super();
        this._uri = uri;
    }
    get uri() {
        return this._uri;
    }
}
const validIpAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const validHostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
class ClientUriBuilder {
    constructor() {
        this._host = '127.0.0.1';
        this._port = 9200;
        this._protocol = 'http';
        this._user = '';
        this._password = '';
    }
    get host() {
        return this._host;
    }
    get port() {
        return this._port;
    }
    get protocol() {
        return this._protocol;
    }
    get user() {
        return this._user;
    }
    get password() {
        return this._password;
    }
    build() {
        if (!this._host) {
            throw new elasticsearch_module_1.ElasticsearchException('Host is required');
        }
        if (!this._port) {
            throw new elasticsearch_module_1.ElasticsearchException('Port is required');
        }
        if (!this._protocol) {
            throw new elasticsearch_module_1.ElasticsearchException('Protocol is required');
        }
        if (this._user && this._password) {
            return new ClientUri(`${this._protocol}://${this._user}:${this._password}@${this._host}:${this._port}`);
        }
        return new ClientUri(`${this._protocol}://${this._host}:${this._port}`);
    }
    setHost(host) {
        if (!validIpAddressRegex.test(host) || !validHostnameRegex.test(host)) {
            throw new elasticsearch_module_1.ElasticsearchException('Host must be a valid ip address or hostname');
        }
        this._host = host;
        return this;
    }
    setPort(port) {
        if (port < 0 || port > 65535) {
            throw new elasticsearch_module_1.ElasticsearchException('Port must be a valid port number');
        }
        this._port = port;
        return this;
    }
    setProtocol(protocol) {
        if (protocol !== 'http' && protocol !== 'https') {
            throw new elasticsearch_module_1.ElasticsearchException('Protocol must be either http or https');
        }
        this._protocol = protocol;
        return this;
    }
    withCredential(user, password) {
        this._user = user;
        this._password = password;
        return this;
    }
}
exports.elasticsearchBuilderCollection = {
    ClientUriBuilder,
};
//# sourceMappingURL=elasticsearch.builder.js.map