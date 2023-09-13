"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchException = void 0;
class ElasticsearchException extends Error {
    constructor(message) {
        super(message);
        this.name = 'ElasticsearchException';
    }
}
exports.ElasticsearchException = ElasticsearchException;
//# sourceMappingURL=elasticsearch.module.js.map