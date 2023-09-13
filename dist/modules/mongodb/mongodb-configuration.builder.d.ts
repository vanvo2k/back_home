import { MongoClientOptions as MongoClientOptionsV3 } from 'mongodb-v3';
import { MongoClientOptions as MongoClientOptionsV4 } from 'mongodb-v4';
import { MongoClientOptions as MongoClientOptionsV5 } from 'mongodb-v5';
import { MongoClientOptions as MongoClientOptionsV6 } from 'mongodb-v6';
import { ObjectiveClass } from './mongodb.common';
export declare class MongodbConfiguration extends ObjectiveClass {
    private readonly _uri;
    private readonly _alias;
    private readonly _options;
    constructor(builder: MongodbConfigurationBuilder);
    private _buildUriNoAccessCredential;
    private _buildUriWithAccessCredential;
    get uri(): string;
    get alias(): string;
    get options(): MongoClientOptionsV3 & MongoClientOptionsV4 & MongoClientOptionsV5 & MongoClientOptionsV6;
}
export declare class MongodbConfigurationBuilder {
    private _uriConfig;
    private _alias;
    private _options;
    constructor();
    get uriConfig(): {
        host: string;
        port: number;
        hasAccessCredentials: boolean;
        username: string;
        password: string;
    };
    get alias(): string;
    get options(): MongoClientOptionsV3 & MongoClientOptionsV4 & MongoClientOptionsV5 & MongoClientOptionsV6;
    setHost(host: string): MongodbConfigurationBuilder;
    setPort(port: number): MongodbConfigurationBuilder;
    withAccessCredentials(username: string, password: string): MongodbConfigurationBuilder;
    setAlias(alias: string): MongodbConfigurationBuilder;
    withOptions(options: MongoClientOptionsV3 & MongoClientOptionsV4 & MongoClientOptionsV5 & MongoClientOptionsV6): MongodbConfigurationBuilder;
    build(): MongodbConfiguration;
}
