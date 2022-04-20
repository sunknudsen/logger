"use strict"

import dotenv from "dotenv"
import { exec } from "child_process"
import assert from "assert"
import git from "git-rev-sync"
import nock from "nock"
import { hostname } from "os"
import { promisify } from "util"
import logger from "./index"

dotenv.config()

const asyncExec = promisify(exec)

describe("logger", () => {
  describe("logger.listSensitiveKeys()", () => {
    it("should return sensitive keys", () => {
      assert.deepEqual(logger.listSensitiveKeys(), ["access_token", "password"])
    })
  })
  describe("logger.log(string)", () => {
    it("should return string", async () => {
      const { stdout } = await asyncExec(
        `node --eval "const logger = require('${__dirname}/index').default; logger.log('foo');"`
      )
      if (process.env.DEBUG === "true") {
        console.log(stdout)
      }
      assert.equal(stdout, "\u001b[32m'foo'\u001b[39m\n\n")
    })
  })
  describe("logger.log(object)", () => {
    it("should return object", async () => {
      const { stdout } = await asyncExec(
        `node --eval "const logger = require('${__dirname}/index').default; logger.log({ foo: 'bar' });"`
      )
      if (process.env.DEBUG === "true") {
        console.log(stdout)
      }
      assert.equal(stdout, "{ foo: \u001b[32m'bar'\u001b[39m }\n\n")
    })
  })
  describe("logger.log(array)", () => {
    it("should return array", async () => {
      const { stdout } = await asyncExec(
        `node --eval "const logger = require('${__dirname}/index').default; logger.log(['foo', 'bar']);"`
      )
      if (process.env.DEBUG === "true") {
        console.log(stdout)
      }
      assert.equal(
        stdout,
        "[ \u001b[32m'foo'\u001b[39m, \u001b[32m'bar'\u001b[39m ]\n\n"
      )
    })
  })
  describe("logger.log(error)", () => {
    it("should return error", async () => {
      const { stdout } = await asyncExec(
        `node --eval "const logger = require('${__dirname}/index').default; logger.log(new Error('BOOM'));"`
      )
      if (process.env.DEBUG === "true") {
        console.log(stdout)
      }
      assert.match(stdout, /Error: BOOM\n    at/)
    })
  })
  describe("logger.log(string, object)", () => {
    it("should return string and object", async () => {
      const { stdout } = await asyncExec(
        `node --eval "const logger = require('${__dirname}/index').default; logger.log('foo', { foo: 'bar' });"`
      )
      if (process.env.DEBUG === "true") {
        console.log(stdout)
      }
      assert(
        stdout,
        "\u001b[32m'foo'\u001b[39m\n{ foo: \u001b[32m'bar'\u001b[39m }\n\n"
      )
    })
  })
  describe("logger.captureException(error, user, extra, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const user = {
          id: "95de1b873ba849e6aa69a4782bf3fb97",
          email: "hello@example.com",
        }
        const extra = {
          access_token: "d0d90fed2b5c4332b12ff6a8498ca461",
          password: "asdasd",
          foo: "bar",
        }
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.notEqual(requestBody.exception, undefined)
                assert.equal(requestBody.environment, "development")
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.extra, {
                  access_token: "[Filtered]",
                  password: "[Filtered]",
                  foo: extra.foo,
                })
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                assert.deepEqual(requestBody.user, user)
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureException(new Error("BOOM"), user, extra, () => {
          resolve(null)
        })
      })
    })
  })
  describe("logger.captureException(error, user, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const user = {
          id: "95de1b873ba849e6aa69a4782bf3fb97",
          email: "hello@example.com",
        }
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.notEqual(requestBody.exception, undefined)
                assert.equal(requestBody.environment, "development")
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                assert.deepEqual(requestBody.user, user)
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureException(new Error("BOOM"), user, () => {
          resolve(null)
        })
      })
    })
  })
  describe("logger.captureException(error, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.notEqual(requestBody.exception, undefined)
                assert.equal(requestBody.environment, "development")
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureException(new Error("BOOM"), () => {
          resolve(null)
        })
      })
    })
  })
  describe("logger.captureMessage(message, level, user, extra, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        const level = "info"
        const user = {
          id: "95de1b873ba849e6aa69a4782bf3fb97",
          email: "hello@example.com",
        }
        const extra = {
          access_token: "d0d90fed2b5c4332b12ff6a8498ca461",
          password: "asdasd",
          foo: "bar",
        }
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.equal(requestBody.level, level)
                assert.equal(requestBody.message, message)
                assert.equal(requestBody.environment, process.env.ENV)
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.extra, {
                  access_token: "[Filtered]",
                  password: "[Filtered]",
                  foo: extra.foo,
                })
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                assert.deepEqual(requestBody.user, user)
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureMessage(message, level, user, extra, () => {
          resolve(null)
        })
      })
    })
  })
  describe("logger.captureMessage(message, level, user, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        const level = "info"
        const user = {
          id: "95de1b873ba849e6aa69a4782bf3fb97",
          email: "hello@example.com",
        }
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.equal(requestBody.level, level)
                assert.equal(requestBody.message, message)
                assert.equal(requestBody.environment, process.env.ENV)
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                assert.deepEqual(requestBody.user, user)
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureMessage(message, level, user, () => {
          resolve(null)
        })
      })
    })
  })
  describe("logger.captureMessage(message, level, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        const level = "info"
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.equal(requestBody.level, level)
                assert.equal(requestBody.message, message)
                assert.equal(requestBody.environment, process.env.ENV)
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureMessage(message, level, () => {
          resolve(null)
        })
      })
    })
  })
  describe("logger.captureMessage(message, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        if (process.env.NOCK === "true") {
          nock("https://sentry.io")
            .post("/api/3926156/store/")
            .reply((uri, requestBody: any) => {
              try {
                assert.equal(requestBody.message, message)
                assert.equal(requestBody.environment, process.env.ENV)
                assert.equal(requestBody.release, git.long())
                assert.deepEqual(requestBody.tags, { hostname: hostname() })
                return [200]
              } catch (error) {
                reject(error)
              }
            })
        }
        logger.captureMessage(message, () => {
          resolve(null)
        })
      })
    })
  })
})
