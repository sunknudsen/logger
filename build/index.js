"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sentry = __importStar(require("@sentry/node"));
const dotenv_1 = __importDefault(require("dotenv"));
const git_rev_sync_1 = __importDefault(require("git-rev-sync"));
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
        if (process.env.SENTRY_DSN) {
            let release;
            try {
                release = git_rev_sync_1.default.long();
            }
            catch (error) {
                if (!error.message.match(/no git repository found/)) {
                    this.log(error);
                }
            }
            sentry.init({
                debug: process.env.DEBUG === "true" ? true : false,
                dsn: process.env.SENTRY_DSN,
                release: release,
                environment: process.env.ENV,
                beforeSend: (event) => {
                    // Filter out sensitive keys
                    if (event.extra instanceof Object) {
                        event.extra = filter(event.extra);
                    }
                    return event;
                },
            });
            this.sentryEnabled = true;
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
        if (this.sentryEnabled) {
            sentry.withScope((scope) => {
                scope.setTag("hostname", os_1.hostname());
                if (user) {
                    scope.setUser(user);
                }
                if (extra && extra instanceof Object) {
                    Object.keys(extra).forEach(function (key) {
                        const _extra = extra;
                        scope.setExtra(key, _extra[key]);
                    });
                }
                sentry.captureException(exception);
                const client = sentry.getCurrentHub().getClient();
                if (client && callback) {
                    // Wait for Sentry to send events, then execute callback
                    client.flush(2000).then(callback);
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
        if (this.sentryEnabled) {
            sentry.withScope((scope) => {
                scope.setTag("hostname", os_1.hostname());
                if (user) {
                    scope.setUser(user);
                }
                if (extra && extra instanceof Object) {
                    Object.keys(extra).forEach(function (key) {
                        const _extra = extra;
                        scope.setExtra(key, _extra[key]);
                    });
                }
                sentry.captureMessage(message, level);
                const client = sentry.getCurrentHub().getClient();
                if (client && callback) {
                    // Wait for Sentry to send events, then execute callback
                    client.flush(2000).then(callback);
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