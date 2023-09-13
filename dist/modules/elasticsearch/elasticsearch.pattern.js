"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClassBuilderPattern = void 0;
class ClassBuilderPattern {
    toPlainObject() {
        return Object.getOwnPropertyNames(this).reduce((obj, key) => {
            obj[key] = this[key];
            return obj;
        }, {});
    }
}
exports.ClassBuilderPattern = ClassBuilderPattern;
//# sourceMappingURL=elasticsearch.pattern.js.map