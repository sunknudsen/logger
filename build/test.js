"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const child_process_1 = require("child_process");
const util_1 = require("util");
const code_1 = require("@hapi/code");
const lab_1 = __importDefault(require("@hapi/lab"));
const index_1 = __importDefault(require("./index"));
dotenv_1.default.config();
const asyncExec = util_1.promisify(child_process_1.exec);
const { experiment, describe, it, after } = (exports.lab = lab_1.default.script());
const wait = function (delay) {
    return new Promise(resolve => setTimeout(resolve, delay));
};
experiment("logger", () => {
    describe("logger.listSensitiveKeys()", () => {
        it("should return sensitive keys", async () => {
            code_1.expect(index_1.default.listSensitiveKeys()).to.equal(["access_token", "password"]);
        });
    });
    describe("logger.log(string)", () => {
        it("should return string", async () => {
            let { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log('foo');"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("\u001b[32m'foo'\u001b[39m\n\n");
        });
    });
    describe("logger.log(object)", () => {
        it("should return object", async () => {
            let { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log({ foo: 'bar' });"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("{ foo: \u001b[32m'bar'\u001b[39m }\n\n");
        });
    });
    describe("logger.log(array)", () => {
        it("should return array", async () => {
            let { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log(['foo', 'bar']);"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("[ \u001b[32m'foo'\u001b[39m, \u001b[32m'bar'\u001b[39m ]\n\n");
        });
    });
    describe("logger.log(error)", () => {
        it("should return error", async () => {
            let { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log(new Error('BOOM'));"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.match(/Error: BOOM\n    at/);
        });
    });
    describe("logger.log(string, object)", () => {
        it("should return string and object", async () => {
            let { stdout } = await asyncExec(`node --eval "const logger = require('${__dirname}/index').default; logger.log('foo', { foo: 'bar' });"`);
            if (process.env.DEBUG === "true") {
                console.log(stdout);
            }
            code_1.expect(stdout).to.equal("\u001b[32m'foo'\u001b[39m\n{ foo: \u001b[32m'bar'\u001b[39m }\n\n");
        });
    });
    // To do: add unit tests for logger.captureException and logger.captureMessage
});
//# sourceMappingURL=test.js.map