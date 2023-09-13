"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerTagColor = exports.LoggerColor = exports.LoggerTag = void 0;
var LoggerTag;
(function (LoggerTag) {
    LoggerTag["INFO"] = "INFO";
    LoggerTag["ERROR"] = "ERROR";
    LoggerTag["WARN"] = "WARN";
    LoggerTag["DEBUG"] = "DEBUG";
})(LoggerTag || (exports.LoggerTag = LoggerTag = {}));
var LoggerColor;
(function (LoggerColor) {
    LoggerColor["yellow"] = "\u001B[33m";
    LoggerColor["red"] = "\u001B[31m";
    LoggerColor["green"] = "\u001B[32m";
    LoggerColor["cyan"] = "\u001B[36m";
    LoggerColor["reset"] = "\u001B[0m";
})(LoggerColor || (exports.LoggerColor = LoggerColor = {}));
var LoggerTagColor;
(function (LoggerTagColor) {
    LoggerTagColor["INFO"] = "\u001B[32m";
    LoggerTagColor["ERROR"] = "\u001B[31m";
    LoggerTagColor["WARN"] = "\u001B[33m";
    LoggerTagColor["DEBUG"] = "\u001B[36m";
})(LoggerTagColor || (exports.LoggerTagColor = LoggerTagColor = {}));
//# sourceMappingURL=logger.constant.js.map