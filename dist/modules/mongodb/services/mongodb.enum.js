"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongodbDriverVersion = exports.StatusClient = void 0;
var StatusClient;
(function (StatusClient) {
    StatusClient["CONNECTED"] = "connected";
    StatusClient["DISCONNECTED"] = "disconnected";
    StatusClient["PENDING"] = "pending";
})(StatusClient || (exports.StatusClient = StatusClient = {}));
var MongodbDriverVersion;
(function (MongodbDriverVersion) {
    MongodbDriverVersion[MongodbDriverVersion["V3"] = 3] = "V3";
    MongodbDriverVersion[MongodbDriverVersion["V4"] = 4] = "V4";
    MongodbDriverVersion[MongodbDriverVersion["V5"] = 5] = "V5";
    MongodbDriverVersion[MongodbDriverVersion["V6"] = 6] = "V6";
})(MongodbDriverVersion || (exports.MongodbDriverVersion = MongodbDriverVersion = {}));
//# sourceMappingURL=mongodb.enum.js.map