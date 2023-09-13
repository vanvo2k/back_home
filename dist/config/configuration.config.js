"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnvironmentVariables = void 0;
const Joi = __importStar(require("joi"));
const dotenv = __importStar(require("dotenv"));
const getEnvFilePath = () => {
    switch (process.env.NODE_ENV) {
        case 'template':
            return '.template.env';
        case 'production':
            return '.production.env';
        case 'test':
            return '.test.env';
        default:
            return '.template.env';
    }
};
dotenv.config({ path: getEnvFilePath() });
const validationSchema = Joi.object({
    NODE_ENV: Joi.string()
        .trim()
        .valid('development', 'production', 'test')
        .required(),
    PORT: Joi.number().required(),
});
class JoiValidation {
    constructor(schema) {
        this.schema = schema;
        this.transform(this._loadEnvFromDotEnv());
    }
    _loadEnvFromDotEnv() {
        const env = dotenv.config({ path: getEnvFilePath() });
        if (env.error) {
            throw new Error(`Failed to load environment variables from ${getEnvFilePath()}`);
        }
        return Object.assign({
            NODE_ENV: process.env.NODE_ENV,
        }, env.parsed);
    }
    transform(incoming) {
        const { value, error } = this.schema.validate(incoming);
        if (error) {
            throw new Error(`Validation failed: ${error.message}`);
        }
        return value;
    }
}
let hasInitialized = false;
class Configuration {
    static initialize() {
        if (!hasInitialized) {
            console.log('Initializing configuration');
            new JoiValidation(validationSchema);
            hasInitialized = true;
            return;
        }
        throw new Error('Configuration already initialized');
    }
}
Configuration.initialize();
class EnvironmentVariables {
    static getVariables() {
        return {
            app: {
                env: process.env.NODE_ENV,
                port: process.env.PORT,
            },
        };
    }
    static get(accessors) {
        const accessorsArray = accessors.split('.');
        let value = this.getVariables();
        for (const accessor of accessorsArray) {
            value = value[accessor];
        }
        return value;
    }
}
exports.EnvironmentVariables = EnvironmentVariables;
//# sourceMappingURL=configuration.config.js.map