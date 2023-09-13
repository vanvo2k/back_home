"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.on('unhandledRejection', console.log);
require("module-alias/register");
require("source-map-support/register");
const logger_module_1 = require("./modules/logger/logger.module");
const configuration_config_1 = require("./config/configuration.config");
const exception_handler_factory_1 = require("./modules/exception-handler/exception-handler.factory");
const mongodb_1 = require("@/modules/mongodb");
async function bootstrap() {
    logger_module_1.LoggerService.debug('Hello World!', configuration_config_1.EnvironmentVariables.getVariables());
    const mongoV3 = mongodb_1.MongodbServiceFactory.getMongodbService(mongodb_1.MongodbDriverVersion.V3);
    const LOCAL_DB = 'local-db';
    const localConfigurationDb = new mongodb_1.MongodbConfigurationBuilder()
        .setHost('185.193.17.44')
        .setPort(27017)
        .setAlias(LOCAL_DB)
        .withAccessCredentials('root', '5~sJYae>kfvQC_Pg')
        .build();
    mongoV3.createClient(localConfigurationDb);
    await mongoV3.connect(LOCAL_DB);
    const client = mongoV3.getClient(LOCAL_DB);
    const pResult = client.db('admin').collection('test').find({});
    const result = await pResult.toArray();
    logger_module_1.LoggerService.debug('Find documents', result);
    return 0;
}
bootstrap()
    .then(exitCode => {
    logger_module_1.LoggerService.info(bootstrap.name, 'Program shut down gracefully!');
    process.exit(exitCode);
})
    .catch(err => {
    exception_handler_factory_1.ExceptionFactory.captureException(err, bootstrap.name);
    process.exit(1);
});
//# sourceMappingURL=main.js.map