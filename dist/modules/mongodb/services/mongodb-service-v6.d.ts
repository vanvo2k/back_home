import { MongoClient } from 'mongodb-v6';
import { MongodbDriverVersion } from './mongodb.enum';
import AbstractMongodbService from './mongodb-service.abstraction';
import { MongodbConfiguration } from '../mongodb-configuration.builder';
type AliasClientName = string;
export default class MongodbServiceV6 extends AbstractMongodbService<MongoClient> {
    private static instance;
    readonly driverVersion: MongodbDriverVersion;
    private constructor();
    static getInstance(): MongodbServiceV6;
    createClient(configuration: MongodbConfiguration): void;
    connect(alias: AliasClientName): Promise<void>;
    disconnect(alias: AliasClientName): Promise<void>;
    getDatabase(alias: AliasClientName, databaseName: string): import("mongodb-v6").Db;
}
export {};
