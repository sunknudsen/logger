declare type CaptureLevel = "debug" | "info" | "warning" | "error" | "fatal";
interface CaptureUser {
    id: number | string;
    email: string;
}
interface CaptureExtra {
    [key: string]: object | string;
}
declare type CaptureCallback = () => void;
declare class Logger {
    constructor();
    listSensitiveKeys(): string[];
    captureException(exception: any, user?: CaptureUser, extra?: CaptureExtra, callback?: CaptureCallback): void;
    captureMessage(message: string, level: CaptureLevel, user?: CaptureUser, extra?: CaptureExtra, callback?: CaptureCallback): void;
    log(...args: any[]): void;
}
declare const _default: Logger;
export default _default;
