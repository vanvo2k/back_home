"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchClientVersion = exports.ClientStatus = void 0;
var ClientStatus;
(function (ClientStatus) {
    ClientStatus["CONNECTED"] = "CONNECTED";
    ClientStatus["DISCONNECTED"] = "DISCONNECTED";
})(ClientStatus || (exports.ClientStatus = ClientStatus = {}));
var ElasticsearchClientVersion;
(function (ElasticsearchClientVersion) {
    ElasticsearchClientVersion["V6"] = "6";
    ElasticsearchClientVersion["V7"] = "7";
    ElasticsearchClientVersion["V8"] = "8";
})(ElasticsearchClientVersion || (exports.ElasticsearchClientVersion = ElasticsearchClientVersion = {}));
//# sourceMappingURL=elasticsearch.enum.js.map