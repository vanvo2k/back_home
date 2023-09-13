import { Client as ClientV6 } from 'elasticsearch-v6';
import { Client as ClientV7 } from 'elasticsearch-v7';
import { ClientStatus, ElasticsearchClientVersion } from './elasticsearch.enum';
export type AliasClientName = string;
export type ClientInstance = ClientV6 | ClientV7;
export type MetadataInstance = {
    uri: string;
    version: ElasticsearchClientVersion;
    status: ClientStatus;
};
export type GetAllIndicesResponse = {
    health: string;
    status: string;
    index: string;
    uuid: string;
    pri: number;
    rep: number;
    docsCount: number;
    docsDeleted: number;
    storeSize: string;
    priStoreSize: string;
};
export type ElasticsearchInfo = {
    name: string;
    cluster_name: string;
    cluster_uuid: string;
    version: {
        number: string;
        build_flavor: string;
        build_type: string;
        build_hash: string;
        build_date: string;
        build_snapshot: boolean;
        lucene_version: string;
        minimum_wire_compatibility_version: string;
        minimum_index_compatibility_version: string;
    };
    tagline: string;
};
