"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExceptionFactory = void 0;
const logger_service_1 = require("../logger/logger.service");
class ExceptionFactory {
    static captureException(err, prefix) {
        if (!(err instanceof Error)) {
            throw new Error('Invalid error type');
        }
        if (!prefix) {
            logger_service_1.LoggerService.error('ExceptionFactory', err);
            return;
        }
        logger_service_1.LoggerService.error(prefix, err);
    }
}
exports.ExceptionFactory = ExceptionFactory;
//# sourceMappingURL=exception-handler.factory.js.map