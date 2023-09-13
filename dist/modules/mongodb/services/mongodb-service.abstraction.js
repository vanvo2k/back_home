"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_exception_1 = require("../mongodb.exception");
class AbstractMongodbService {
    constructor() {
        this._clients = new Map();
        this._metadata = new Map();
    }
    getMetadata(alias) {
        if (!this._metadata.has(alias)) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' not instantiated`);
        }
        return this._metadata.get(alias);
    }
    getClient(alias) {
        if (!this._clients.has(alias) || !this._metadata.has(alias)) {
            throw new mongodb_exception_1.MongodbModuleException(`alias='${alias}' not instantiated`);
        }
        return this._clients.get(alias);
    }
}
exports.default = AbstractMongodbService;
//# sourceMappingURL=mongodb-service.abstraction.js.map