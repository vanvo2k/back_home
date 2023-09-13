"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElasticsearchService = exports.ElasticsearchAPI = void 0;
const axios_1 = __importDefault(require("axios"));
const elasticsearch_v6_1 = require("elasticsearch-v6");
const elasticsearch_v7_1 = require("elasticsearch-v7");
const logger_service_1 = require("../logger/logger.service");
const elasticsearch_helper_1 = require("./elasticsearch.helper");
const elasticsearch_module_1 = require("./elasticsearch.module");
const elasticsearch_enum_1 = require("./elasticsearch.enum");
class ElasticsearchAPI {
    constructor() {
        this._getAllIndicesAPI = new Map();
        this._getAllIndicesAPI.set(elasticsearch_enum_1.ElasticsearchClientVersion.V6, '_cat/indices');
        this._getAllIndicesAPI.set(elasticsearch_enum_1.ElasticsearchClientVersion.V7, '_cat/indices');
        this._getAllIndicesAPI.set(elasticsearch_enum_1.ElasticsearchClientVersion.V8, '_cat/indices');
        logger_service_1.LoggerService.info(ElasticsearchAPI.name, 'Init ElasticsearchAPI');
    }
    static getInstance() {
        if (!ElasticsearchAPI._instance) {
            ElasticsearchAPI._instance = new ElasticsearchAPI();
        }
        return ElasticsearchAPI._instance;
    }
    getAllIndicesAPI(version) {
        return this._getAllIndicesAPI.get(version);
    }
}
exports.ElasticsearchAPI = ElasticsearchAPI;
class ElasticsearchService {
    constructor() {
        logger_service_1.LoggerService.debug(ElasticsearchService.name, 'Init ElasticsearchService');
    }
    static _getMetadataOfConnectedClient(alias) {
        if (!ElasticsearchService._metadata.has(alias)) {
            throw new elasticsearch_module_1.ElasticsearchException(`Client alias='${alias}' not found`);
        }
        const { metadata } = ElasticsearchService.getInstance(alias);
        if (metadata.status === elasticsearch_enum_1.ClientStatus.DISCONNECTED) {
            throw new elasticsearch_module_1.ElasticsearchException('Client disconnected');
        }
        return metadata;
    }
    static async initV6(uri, alias, options = {}) {
        const opts = Object.assign({ node: uri }, options);
        const serverInfo = await ElasticsearchService.ping(uri);
        const version = serverInfo.version.number.substring(0, 1);
        if (version !== elasticsearch_enum_1.ElasticsearchClientVersion.V6) {
            throw new elasticsearch_module_1.ElasticsearchException(`Version mismatch. Expected initV${version}()`);
        }
        const client = new elasticsearch_v6_1.Client(opts);
        const metadata = {
            uri,
            version,
            status: elasticsearch_enum_1.ClientStatus.CONNECTED,
        };
        ElasticsearchService._instances.set(alias, client);
        ElasticsearchService._metadata.set(alias, metadata);
    }
    static async initV7(uri, alias, options = {}) {
        const opts = Object.assign({ node: uri }, options);
        const serverInfo = await ElasticsearchService.ping(uri);
        const version = serverInfo.version.number.substring(0, 1);
        if (version !== elasticsearch_enum_1.ElasticsearchClientVersion.V7) {
            throw new elasticsearch_module_1.ElasticsearchException(`Version mismatch. Expected initV${version}()`);
        }
        const client = new elasticsearch_v7_1.Client(opts);
        const metadata = {
            uri,
            version,
            status: elasticsearch_enum_1.ClientStatus.CONNECTED,
        };
        ElasticsearchService._instances.set(alias, client);
        ElasticsearchService._metadata.set(alias, metadata);
    }
    static getInstance(alias) {
        const instance = ElasticsearchService._instances.get(alias);
        const metadata = ElasticsearchService._metadata.get(alias);
        if (!instance) {
            throw new elasticsearch_module_1.ElasticsearchException(`Client alias='${alias}' not found`);
        }
        return {
            instance,
            metadata,
        };
    }
    static async ping(uri) {
        try {
            const { data } = await axios_1.default.get(uri);
            if (!data) {
                throw new Error(`Ping uri='${uri}' failed`);
            }
            logger_service_1.LoggerService.info('ElasticsearchService', `Ping uri='${uri}' success`);
            return data;
        }
        catch (err) {
            (0, elasticsearch_helper_1.handleAxiosError)(err);
        }
    }
    static _computeGetAllIndicesResponse(rawText) {
        const result = rawText
            .split('\n')
            .filter(item => item !== '')
            .map(item => {
            const [health, status, index, uuid, pri, rep, docsCount, docsDeleted, storeSize, priStoreSize,] = item.split(' ').filter(item => item !== '');
            return {
                health,
                status,
                index,
                uuid,
                pri: Number(pri),
                rep: Number(rep),
                docsCount: Number(docsCount),
                docsDeleted: Number(docsDeleted),
                storeSize,
                priStoreSize,
            };
        });
        return result;
    }
    static async getAllIndices(alias) {
        const { version, uri } = ElasticsearchService._getMetadataOfConnectedClient(alias);
        const endpoint = ElasticsearchAPI.getInstance().getAllIndicesAPI(version);
        try {
            const { data } = await axios_1.default.get(`${uri}/${endpoint}`);
            return ElasticsearchService._computeGetAllIndicesResponse(data);
        }
        catch (err) {
            (0, elasticsearch_helper_1.handleAxiosError)(err);
        }
    }
}
exports.ElasticsearchService = ElasticsearchService;
ElasticsearchService._instances = new Map();
ElasticsearchService._metadata = new Map();
//# sourceMappingURL=elasticsearch.service.js.map