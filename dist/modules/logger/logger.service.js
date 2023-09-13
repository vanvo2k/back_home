"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const logger_constant_1 = require("./logger.constant");
class LoggerService {
    static info(content, ...args) {
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv)
            throw new Error('[LoggerService] NODE_ENV is undefined]');
        if (nodeEnv === 'test')
            return;
        console.log(`[${this._colorizeText('INFO', logger_constant_1.LoggerTagColor.INFO)}]:${this._colorizeText(this._getTimestamp(), logger_constant_1.LoggerTagColor.INFO)}: [${content}]`, ...args);
    }
    static debug(content, ...args) {
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv)
            throw new Error('[LoggerService] NODE_ENV is undefined]');
        if (nodeEnv === 'test')
            return;
        console.log(`[${this._colorizeText('DEBUG', logger_constant_1.LoggerTagColor.DEBUG)}]:${this._colorizeText(this._getTimestamp(), logger_constant_1.LoggerTagColor.DEBUG)}: [${content}]`, ...args);
    }
    static error(content, ...args) {
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv)
            throw new Error('[LoggerService] NODE_ENV is undefined]');
        if (nodeEnv === 'test')
            return;
        console.log(`[${this._colorizeText('ERROR', logger_constant_1.LoggerTagColor.ERROR)}]:${this._colorizeText(this._getTimestamp(), logger_constant_1.LoggerTagColor.ERROR)}: [${content}]`, ...args);
    }
    static log(tag, content, ...args) {
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv)
            throw new Error('[LoggerService] NODE_ENV is undefined]');
        if (nodeEnv === 'test')
            return;
        if (nodeEnv === 'production' && tag === logger_constant_1.LoggerTag.DEBUG)
            return;
        console.log(`[${this._colorizeText(tag, logger_constant_1.LoggerTagColor[tag])}]:${this._colorizeText(this._getTimestamp(), logger_constant_1.LoggerTagColor.DEBUG)}: [${content}]`, ...args);
    }
}
exports.LoggerService = LoggerService;
LoggerService._getTimestamp = () => new Date().toISOString();
LoggerService._colorizeText = (text, color) => `${color}${text}${logger_constant_1.LoggerColor.reset}`;
//# sourceMappingURL=logger.service.js.map