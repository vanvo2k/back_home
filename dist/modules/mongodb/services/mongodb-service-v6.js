"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_v6_1 = require("mongodb-v6");
const mongodb_enum_1 = require("./mongodb.enum");
const mongodb_service_abstraction_1 = __importDefault(require("./mongodb-service.abstraction"));
const mongodb_exception_1 = require("../mongodb.exception");
class MongodbServiceV6 extends mongodb_service_abstraction_1.default {
    constructor() {
        super();
        this.driverVersion = mongodb_enum_1.MongodbDriverVersion.V6;
    }
    static getInstance() {
        if (MongodbServiceV6.instance === null) {
            MongodbServiceV6.instance = new MongodbServiceV6();
        }
        return MongodbServiceV6.instance;
    }
    createClient(configuration) {
        if (this._clients.has(configuration.alias) ||
            this._metadata.has(configuration.alias)) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${configuration.alias}' already instantiated`);
        }
        this._clients.set(configuration.alias, new mongodb_v6_1.MongoClient(configuration.uri, configuration.options));
        this._metadata.set(configuration.alias, {
            version: this.driverVersion,
            uri: configuration.uri,
            options: configuration.options,
            status: mongodb_enum_1.StatusClient.PENDING,
        });
    }
    async connect(alias) {
        const metadata = this._metadata.get(alias);
        const client = this._clients.get(alias);
        if (!metadata || !client) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' not instantiated`);
        }
        if (metadata.status === mongodb_enum_1.StatusClient.CONNECTED) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' already connected`);
        }
        try {
            await client.connect();
            metadata.status = mongodb_enum_1.StatusClient.CONNECTED;
            this._metadata.set(alias, metadata);
        }
        catch (error) {
            throw new mongodb_exception_1.MongodbModuleException(error);
        }
    }
    async disconnect(alias) {
        const metadata = this._metadata.get(alias);
        const client = this._clients.get(alias);
        if (!metadata || !client) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' not instantiated`);
        }
        if (metadata.status === mongodb_enum_1.StatusClient.DISCONNECTED) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' already disconnected`);
        }
        try {
            await client.close();
            metadata.status = mongodb_enum_1.StatusClient.DISCONNECTED;
            this._metadata.set(alias, metadata);
        }
        catch (error) {
            throw new mongodb_exception_1.MongodbModuleException(error);
        }
    }
    getDatabase(alias, databaseName) {
        const metadata = this._metadata.get(alias);
        const client = this._clients.get(alias);
        if (!metadata || !client) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' not instantiated`);
        }
        if (metadata.status !== mongodb_enum_1.StatusClient.CONNECTED) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' is not connected`);
        }
        return client.db(databaseName);
    }
}
MongodbServiceV6.instance = null;
exports.default = MongodbServiceV6;
//# sourceMappingURL=mongodb-service-v6.js.map