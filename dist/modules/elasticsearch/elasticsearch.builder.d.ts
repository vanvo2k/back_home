export declare class ClassBuilderPattern {
    toPlainObject(): {};
}
declare class ClientUri extends ClassBuilderPattern {
    private _uri;
    constructor(uri: string);
    get uri(): string;
}
declare class ClientUriBuilder {
    constructor();
    private _host;
    private _port;
    private _protocol;
    private _user;
    private _password;
    get host(): string;
    get port(): number;
    get protocol(): string;
    get user(): string;
    get password(): string;
    build(): ClientUri;
    setHost(host: string): this;
    setPort(port: number): this;
    setProtocol(protocol: string): this;
    withCredential(user: string, password: string): this;
}
export declare const elasticsearchBuilderCollection: {
    ClientUriBuilder: typeof ClientUriBuilder;
};
export {};
