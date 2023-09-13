import { MongodbConfiguration } from '../mongodb-configuration.builder';
import { IMetadataInstance } from './../interfaces/IMetadataInstance';
type AliasClientName = string;
export default abstract class AbstractMongodbService<T> {
    protected _clients: Map<AliasClientName, T>;
    protected _metadata: Map<AliasClientName, IMetadataInstance>;
    protected constructor();
    getMetadata(alias: AliasClientName): IMetadataInstance;
    getClient(alias: AliasClientName): T;
    abstract createClient(configuration: MongodbConfiguration): void;
    abstract connect(alias: AliasClientName): Promise<void>;
    abstract disconnect(alias: AliasClientName): Promise<void>;
    abstract getDatabase(alias: AliasClientName, databaseName: string): unknown;
}
export {};
