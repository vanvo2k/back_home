import MongodbServiceV3 from './mongodb-service-v3';
import MongodbServiceV4 from './mongodb-service-v4';
import MongodbServiceV5 from './mongodb-service-v5';
import MongodbServiceV6 from './mongodb-service-v6';
export declare class MongodbServiceFactory {
    static getMongodbService<T>(version: number): T;
    private constructor();
}
export { MongodbServiceV3, MongodbServiceV4, MongodbServiceV5, MongodbServiceV6, };
