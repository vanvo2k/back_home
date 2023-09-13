import { ClientOptions as ClientOptionsV6 } from 'elasticsearch-v6';
import { ClientOptions as ClientOptionsV7 } from 'elasticsearch-v7';
import { IElasticsearchAPI } from './elasticsearch.interface';
import { ElasticsearchClientVersion } from './elasticsearch.enum';
import { AliasClientName, ClientInstance, ElasticsearchInfo, GetAllIndicesResponse, MetadataInstance } from './elasticsearch.type';
export declare class ElasticsearchAPI implements IElasticsearchAPI {
    private static _instance;
    protected _getAllIndicesAPI: Map<ElasticsearchClientVersion, string>;
    private constructor();
    static getInstance(): ElasticsearchAPI;
    getAllIndicesAPI(version: ElasticsearchClientVersion): string;
}
export declare class ElasticsearchService {
    private static _instances;
    private static _metadata;
    private constructor();
    private static _getMetadataOfConnectedClient;
    static initV6(uri: string, alias: AliasClientName, options?: ClientOptionsV6): Promise<void>;
    static initV7(uri: string, alias: AliasClientName, options?: ClientOptionsV7): Promise<void>;
    static getInstance(alias: AliasClientName): {
        instance: ClientInstance;
        metadata: MetadataInstance;
    };
    static ping(uri: string): Promise<ElasticsearchInfo>;
    private static _computeGetAllIndicesResponse;
    static getAllIndices(alias: AliasClientName): Promise<GetAllIndicesResponse[]>;
}
