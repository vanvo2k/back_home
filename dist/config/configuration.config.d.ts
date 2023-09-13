export declare class EnvironmentVariables {
    static getVariables(): {
        app: {
            env: string;
            port: string;
        };
    };
    static get(accessors: string): {
        app: {
            env: string;
            port: string;
        };
    };
}
