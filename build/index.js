"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const git_rev_sync_1 = __importDefault(require("git-rev-sync"));
const sentry = __importStar(require("@sentry/node"));
const os_1 = require("os");
const util_1 = __importDefault(require("util"));
dotenv_1.default.config();
var sensitiveKeys = [];
if (process.env.LOGGER_SENSITIVE_KEYS) {
    sensitiveKeys = process.env.LOGGER_SENSITIVE_KEYS.split(",");
}
const filter = function (extra) {
    Object.keys(extra).forEach(function (key) {
        if (sensitiveKeys.includes(key)) {
            extra[key] = "[Filtered]";
        }
        else if (extra[key] instanceof Object) {
            extra[key] = filter(extra[key]);
        }
    });
    return extra;
};
class Logger {
    constructor() {
        if (process.env.ENV === "production" || process.env.SENTRY === "true") {
            sentry.init({
                debug: process.env.DEBUG === "true" ? true : false,
                dsn: process.env.SENTRY_DSN,
                release: git_rev_sync_1.default.long(),
                environment: process.env.ENV,
                beforeSend: event => {
                    // Filter out sensitive keys
                    if (event.extra instanceof Object) {
                        event.extra = filter(event.extra);
                    }
                    return event;
                },
            });
        }
    }
    listSensitiveKeys() {
        return sensitiveKeys;
    }
    captureException(exception, user, extra, callback) {
        if (typeof user === "function") {
            callback = user;
            user = null;
            extra = null;
        }
        else if (typeof extra === "function") {
            callback = extra;
            extra = null;
        }
        if (process.env.DEBUG === "true") {
            this.log("Capture exception");
            this.log({ exception, user, extra });
        }
        if (process.env.ENV === "production" || process.env.SENTRY === "true") {
            sentry.withScope(scope => {
                scope.setTag("hostname", os_1.hostname());
                if (user) {
                    scope.setUser(user);
                }
                if (extra !== null && extra instanceof Object) {
                    Object.keys(extra).forEach(function (key) {
                        scope.setExtra(key, extra[key]);
                    });
                }
                sentry.captureException(exception);
                let client = sentry.getCurrentHub().getClient();
                if (client && callback) {
                    // Wait for Sentry to send events, then execute callback
                    client.close(2000).then(callback);
                }
            });
        }
        else if (callback) {
            callback();
        }
    }
    captureMessage(message, level, user, extra, callback) {
        if (typeof level === "function") {
            callback = level;
            level = null;
        }
        else if (typeof user === "function") {
            callback = user;
            user = null;
        }
        else if (typeof extra === "function") {
            callback = extra;
            extra = null;
        }
        if (process.env.DEBUG === "true") {
            this.log("Capture message");
            this.log({ message, level, user, extra });
        }
        if (process.env.ENV === "production" || process.env.SENTRY === "true") {
            sentry.withScope(scope => {
                scope.setTag("hostname", os_1.hostname());
                if (user) {
                    scope.setUser(user);
                }
                if (extra !== null && extra instanceof Object) {
                    Object.keys(extra).forEach(function (key) {
                        scope.setExtra(key, extra[key]);
                    });
                }
                sentry.captureMessage(message, level);
                let client = sentry.getCurrentHub().getClient();
                if (client && callback) {
                    // Wait for Sentry to send events, then execute callback
                    client.close(2000).then(callback);
                }
            });
        }
        else if (callback) {
            callback();
        }
    }
    log(...args) {
        args.forEach(function (arg) {
            console.log(util_1.default.inspect(arg, false, 20, true));
        });
        console.log(); // Add line break for readability
    }
}
exports.default = new Logger();
//# sourceMappingURL=index.js.map