"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongodbConfigurationBuilder = exports.MongodbConfiguration = void 0;
const mongodb_exception_1 = require("./mongodb.exception");
const mongodb_common_1 = require("./mongodb.common");
const isNumeric = number => {
    return !isNaN(parseFloat(number)) && isFinite(number);
};
const validIpAddressRegex = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5]).){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const validHostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]).)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/;
class MongodbConfiguration extends mongodb_common_1.ObjectiveClass {
    constructor(builder) {
        super();
        this._uri = builder.uriConfig.hasAccessCredentials
            ? this._buildUriWithAccessCredential(builder)
            : this._buildUriNoAccessCredential(builder);
        this._alias = builder.alias;
        this._options = builder.options;
    }
    _buildUriNoAccessCredential(builder) {
        return `mongodb://${builder.uriConfig.host}:${builder.uriConfig.port}`;
    }
    _buildUriWithAccessCredential(builder) {
        return `mongodb://${builder.uriConfig.username}:${builder.uriConfig.password}@${builder.uriConfig.host}:${builder.uriConfig.port}`;
    }
    get uri() {
        return this._uri;
    }
    get alias() {
        return this._alias;
    }
    get options() {
        return this._options;
    }
}
exports.MongodbConfiguration = MongodbConfiguration;
class MongodbConfigurationBuilder {
    constructor() {
        this._uriConfig = {
            host: '',
            port: 0,
            hasAccessCredentials: false,
            username: '',
            password: '',
        };
        this._alias = '';
        this._options = {};
    }
    get uriConfig() {
        return this._uriConfig;
    }
    get alias() {
        return this._alias;
    }
    get options() {
        return this._options;
    }
    setHost(host) {
        if (!validIpAddressRegex.test(host) || !validHostnameRegex.test(host)) {
            throw new mongodb_exception_1.MongodbModuleException('Host must be a valid ip address or hostname');
        }
        this._uriConfig.host = host;
        return this;
    }
    setPort(port) {
        if (!isNumeric(port)) {
            throw new mongodb_exception_1.MongodbModuleException('Port must be a number');
        }
        if (port < 0 || port > 65535) {
            throw new mongodb_exception_1.MongodbModuleException('Port must be between 0 and 65535');
        }
        this._uriConfig.port = port;
        return this;
    }
    withAccessCredentials(username, password) {
        const specialCharacters = ['$', ':', '/', '?', '#', '[', ']', '@'];
        let formattedPassword = password;
        if (specialCharacters.some(char => password.includes(char))) {
            formattedPassword = encodeURIComponent(password);
        }
        this._uriConfig.hasAccessCredentials = true;
        this._uriConfig.username = username;
        this._uriConfig.password = formattedPassword;
        return this;
    }
    setAlias(alias) {
        this._alias = alias;
        return this;
    }
    withOptions(options) {
        this._options = options;
        return this;
    }
    build() {
        if (!this._uriConfig.host) {
            throw new mongodb_exception_1.MongodbModuleException('Host required to build mongodb configuration');
        }
        if (!this._uriConfig.port) {
            throw new mongodb_exception_1.MongodbModuleException('Port required to build mongodb configuration');
        }
        if (!this._alias) {
            throw new mongodb_exception_1.MongodbModuleException('Alias required to build mongodb configuration');
        }
        return new MongodbConfiguration(this);
    }
}
exports.MongodbConfigurationBuilder = MongodbConfigurationBuilder;
//# sourceMappingURL=mongodb-configuration.builder.js.map