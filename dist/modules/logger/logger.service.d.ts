import { LoggerTag } from './logger.constant';
export declare class LoggerService {
    static info(content: string, ...args: any): void;
    static debug(content: string, ...args: any): void;
    static error(content: string, ...args: any): void;
    static log(tag: LoggerTag, content: string, ...args: any): void;
    private static _getTimestamp;
    private static _colorizeText;
}
