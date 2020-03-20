declare type CaptureLevel = "debug" | "info" | "warning" | "error" | "fatal";
interface CaptureUser {
    id: number | string;
    email?: string;
}
interface CaptureExtra {
    [key: string]: string | number | object;
}
declare type CaptureCallback = () => void;
declare class Logger {
    private sentryEnabled;
    constructor();
    listSensitiveKeys(): string[];
    captureException(exception: any, user?: CaptureUser | CaptureCallback, extra?: CaptureExtra | CaptureCallback, callback?: CaptureCallback): void;
    captureMessage(message: string, level: CaptureLevel | CaptureCallback, user?: CaptureUser | CaptureCallback, extra?: CaptureExtra | CaptureCallback, callback?: CaptureCallback): void;
    log(...args: any[]): void;
}
declare const _default: Logger;
export default _default;
