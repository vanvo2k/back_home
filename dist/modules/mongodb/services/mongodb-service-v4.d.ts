import { MongoClient } from 'mongodb-v4';
import { MongodbDriverVersion } from './mongodb.enum';
import AbstractMongodbService from './mongodb-service.abstraction';
import { MongodbConfiguration } from '../mongodb-configuration.builder';
type AliasClientName = string;
export default class MongodbServiceV4 extends AbstractMongodbService<MongoClient> {
    private static instance;
    readonly driverVersion: MongodbDriverVersion;
    private constructor();
    static getInstance(): MongodbServiceV4;
    createClient(configuration: MongodbConfiguration): void;
    connect(alias: AliasClientName): Promise<void>;
    disconnect(alias: AliasClientName): Promise<void>;
    getDatabase(alias: AliasClientName, databaseName: string): import("mongodb-v4").Db;
}
export {};
