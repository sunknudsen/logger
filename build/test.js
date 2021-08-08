"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const code_1 = require("@hapi/code");
const lab_1 = __importDefault(require("@hapi/lab"));
const child_process_1 = require("child_process");
const dotenv_1 = __importDefault(require("dotenv"));
const git_rev_sync_1 = __importDefault(require("git-rev-sync"));
const nock_1 = __importDefault(require("nock"));
const os_1 = require("os");
const util_1 = require("util");
const index_1 = __importDefault(require("./index"));
dotenv_1.default.config();
const asyncExec = util_1.promisify(child_process_1.exec);
const { experiment, describe, it } = (exports.lab = lab_1.default.script());
experiment("logger", () => {
    describe("logger.listSensitiveKeys()", () => {
        it("should return sensitive keys", () => {
            code_1.expect(index_1.default.listSensitiveKeys()).to.equal(["access_token", "password"]);
        });
    });
    describe("logger.log(string)", () => {
        it("should return string", async () => {
            const { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log('foo');"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("\u001b[32m'foo'\u001b[39m\n\n");
        });
    });
    describe("logger.log(object)", () => {
        it("should return object", async () => {
            const { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log({ foo: 'bar' });"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("{ foo: \u001b[32m'bar'\u001b[39m }\n\n");
        });
    });
    describe("logger.log(array)", () => {
        it("should return array", async () => {
            const { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log(['foo', 'bar']);"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("[ \u001b[32m'foo'\u001b[39m, \u001b[32m'bar'\u001b[39m ]\n\n");
        });
    });
    describe("logger.log(error)", () => {
        it("should return error", async () => {
            const { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log(new Error('BOOM'));"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.match(/Error: BOOM\n    at/);
        });
    });
    describe("logger.log(string, object)", () => {
        it("should return string and object", async () => {
            const { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log('foo', { foo: 'bar' });"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("\u001b[32m'foo'\u001b[39m\n{ foo: \u001b[32m'bar'\u001b[39m }\n\n");
        });
    });
    describe("logger.captureException(error, user, extra, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                const user = {
                    id: "95de1b873ba849e6aa69a4782bf3fb97",
                    email: "hello@example.com",
                };
                const extra = {
                    access_token: "d0d90fed2b5c4332b12ff6a8498ca461",
                    password: "asdasd",
                    foo: "bar",
                };
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.exception).to.exist();
                        code_1.expect(requestBody.environment).to.equal("development");
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.extra).to.equal({
                            access_token: "[Filtered]",
                            password: "[Filtered]",
                            foo: extra.foo,
                        });
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        code_1.expect(requestBody.user).to.equal(user);
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureException(new Error("BOOM"), user, extra, () => {
                    resolve(null);
                });
            });
        });
    });
    describe("logger.captureException(error, user, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                const user = {
                    id: "95de1b873ba849e6aa69a4782bf3fb97",
                    email: "hello@example.com",
                };
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.exception).to.exist();
                        code_1.expect(requestBody.environment).to.equal("development");
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        code_1.expect(requestBody.user).to.equal(user);
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureException(new Error("BOOM"), user, () => {
                    resolve(null);
                });
            });
        });
    });
    describe("logger.captureException(error, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.exception).to.exist();
                        code_1.expect(requestBody.environment).to.equal("development");
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureException(new Error("BOOM"), () => {
                    resolve(null);
                });
            });
        });
    });
    describe("logger.captureMessage(message, level, user, extra, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                const message = "foo";
                const level = "info";
                const user = {
                    id: "95de1b873ba849e6aa69a4782bf3fb97",
                    email: "hello@example.com",
                };
                const extra = {
                    access_token: "d0d90fed2b5c4332b12ff6a8498ca461",
                    password: "asdasd",
                    foo: "bar",
                };
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.level).to.equal(level);
                        code_1.expect(requestBody.message).to.equal(message);
                        code_1.expect(requestBody.environment).to.equal(process.env.ENV);
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.extra).to.equal({
                            access_token: "[Filtered]",
                            password: "[Filtered]",
                            foo: extra.foo,
                        });
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        code_1.expect(requestBody.user).to.equal(user);
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureMessage(message, level, user, extra, () => {
                    resolve(null);
                });
            });
        });
    });
    describe("logger.captureMessage(message, level, user, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                const message = "foo";
                const level = "info";
                const user = {
                    id: "95de1b873ba849e6aa69a4782bf3fb97",
                    email: "hello@example.com",
                };
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.level).to.equal(level);
                        code_1.expect(requestBody.message).to.equal(message);
                        code_1.expect(requestBody.environment).to.equal(process.env.ENV);
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        code_1.expect(requestBody.user).to.equal(user);
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureMessage(message, level, user, () => {
                    resolve(null);
                });
            });
        });
    });
    describe("logger.captureMessage(message, level, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                const message = "foo";
                const level = "info";
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.level).to.equal(level);
                        code_1.expect(requestBody.message).to.equal(message);
                        code_1.expect(requestBody.environment).to.equal(process.env.ENV);
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureMessage(message, level, () => {
                    resolve(null);
                });
            });
        });
    });
    describe("logger.captureMessage(message, callback)", () => {
        it("should send captured exception to sentry", () => {
            return new Promise((resolve, reject) => {
                const message = "foo";
                nock_1.default("https://sentry.io")
                    .post("/api/3926156/store/")
                    .reply((uri, requestBody) => {
                    try {
                        code_1.expect(requestBody.message).to.equal(message);
                        code_1.expect(requestBody.environment).to.equal(process.env.ENV);
                        code_1.expect(requestBody.release).to.equal(git_rev_sync_1.default.long());
                        code_1.expect(requestBody.tags).to.equal({ hostname: os_1.hostname() });
                        return [200];
                    }
                    catch (error) {
                        reject(error);
                    }
                });
                index_1.default.captureMessage(message, () => {
                    resolve(null);
                });
            });
        });
    });
});
//# sourceMappingURL=test.js.map