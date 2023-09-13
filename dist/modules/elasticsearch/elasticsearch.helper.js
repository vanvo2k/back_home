"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAxiosError = void 0;
const elasticsearch_module_1 = require("./elasticsearch.module");
const handleAxiosError = (error) => {
    if ((error === null || error === void 0 ? void 0 : error.code) === 'ECONNREFUSED') {
        throw new Error('Connection refused');
    }
    throw new elasticsearch_module_1.ElasticsearchException(error.message);
};
exports.handleAxiosError = handleAxiosError;
//# sourceMappingURL=elasticsearch.helper.js.map