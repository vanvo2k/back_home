"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ObjectiveClass = void 0;
class ObjectiveClass {
    toPlainObject() {
        return Object.getOwnPropertyNames(this).reduce((obj, key) => {
            obj[key] = this[key];
            return obj;
        }, {});
    }
}
exports.ObjectiveClass = ObjectiveClass;
//# sourceMappingURL=mongodb.common.js.map