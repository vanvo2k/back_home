"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongodbModuleException = void 0;
class MongodbModuleException extends Error {
    constructor(message) {
        super(message);
        this.name = 'MongodbModuleException';
    }
}
exports.MongodbModuleException = MongodbModuleException;
//# sourceMappingURL=mongodb.exception.js.map