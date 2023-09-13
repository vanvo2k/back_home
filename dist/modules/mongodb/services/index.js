"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongodbServiceV6 = exports.MongodbServiceV5 = exports.MongodbServiceV4 = exports.MongodbServiceV3 = exports.MongodbServiceFactory = void 0;
const mongodb_exception_1 = require("../mongodb.exception");
const mongodb_enum_1 = require("./mongodb.enum");
const mongodb_service_v3_1 = __importDefault(require("./mongodb-service-v3"));
exports.MongodbServiceV3 = mongodb_service_v3_1.default;
const mongodb_service_v4_1 = __importDefault(require("./mongodb-service-v4"));
exports.MongodbServiceV4 = mongodb_service_v4_1.default;
const mongodb_service_v5_1 = __importDefault(require("./mongodb-service-v5"));
exports.MongodbServiceV5 = mongodb_service_v5_1.default;
const mongodb_service_v6_1 = __importDefault(require("./mongodb-service-v6"));
exports.MongodbServiceV6 = mongodb_service_v6_1.default;
const instanceMap = new Map();
instanceMap.set(mongodb_enum_1.MongodbDriverVersion.V3, mongodb_service_v3_1.default.getInstance());
instanceMap.set(mongodb_enum_1.MongodbDriverVersion.V4, mongodb_service_v4_1.default.getInstance());
instanceMap.set(mongodb_enum_1.MongodbDriverVersion.V5, mongodb_service_v5_1.default.getInstance());
instanceMap.set(mongodb_enum_1.MongodbDriverVersion.V6, mongodb_service_v6_1.default.getInstance());
class MongodbServiceFactory {
    static getMongodbService(version) {
        if (!instanceMap.has(version)) {
            throw new mongodb_exception_1.MongodbModuleException(`MongodbServiceFactory: version=${version} not supported`);
        }
        return instanceMap.get(version);
    }
    constructor() { }
}
exports.MongodbServiceFactory = MongodbServiceFactory;
//# sourceMappingURL=index.js.map