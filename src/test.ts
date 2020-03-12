"use strict"

import { expect } from "@hapi/code"
import lab from "@hapi/lab"
import { exec } from "child_process"
import dotenv from "dotenv"
import git from "git-rev-sync"
import nock from "nock"
import { hostname } from "os"
import { promisify } from "util"
import logger, { CaptureLevel } from "./index"

dotenv.config()

const asyncExec = promisify(exec)

const { experiment, describe, it } = (exports.lab = lab.script())

experiment("logger", () => {
  describe("logger.listSensitiveKeys()", () => {
    it("should return sensitive keys", () => {
      expect(logger.listSensitiveKeys()).to.equal(["access_token", "password"])
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
      expect(stdout).to.equal("\u001b[32m'foo'\u001b[39m\n\n")
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
      expect(stdout).to.equal("{ foo: \u001b[32m'bar'\u001b[39m }\n\n")
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
      expect(stdout).to.equal(
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
      expect(stdout).to.match(/Error: BOOM\n    at/)
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
      expect(stdout).to.equal(
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
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.exception).to.exist()
              expect(requestBody.environment).to.equal("development")
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.extra).to.equal({
                access_token: "[Filtered]",
                password: "[Filtered]",
                foo: extra.foo,
              })
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              expect(requestBody.user).to.equal(user)
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureException(new Error("BOOM"), user, extra, () => {
          resolve()
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
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.exception).to.exist()
              expect(requestBody.environment).to.equal("development")
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              expect(requestBody.user).to.equal(user)
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureException(new Error("BOOM"), user, () => {
          resolve()
        })
      })
    })
  })
  describe("logger.captureException(error, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.exception).to.exist()
              expect(requestBody.environment).to.equal("development")
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureException(new Error("BOOM"), () => {
          resolve()
        })
      })
    })
  })
  describe("logger.captureMessage(message, level, user, extra, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        const level = "info" as CaptureLevel
        const user = {
          id: "95de1b873ba849e6aa69a4782bf3fb97",
          email: "hello@example.com",
        }
        const extra = {
          access_token: "d0d90fed2b5c4332b12ff6a8498ca461",
          password: "asdasd",
          foo: "bar",
        }
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.level).to.equal(level)
              expect(requestBody.message).to.equal(message)
              expect(requestBody.environment).to.equal(process.env.ENV)
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.extra).to.equal({
                access_token: "[Filtered]",
                password: "[Filtered]",
                foo: extra.foo,
              })
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              expect(requestBody.user).to.equal(user)
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureMessage(message, level, user, extra, () => {
          resolve()
        })
      })
    })
  })
  describe("logger.captureMessage(message, level, user, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        const level = "info" as CaptureLevel
        const user = {
          id: "95de1b873ba849e6aa69a4782bf3fb97",
          email: "hello@example.com",
        }
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.level).to.equal(level)
              expect(requestBody.message).to.equal(message)
              expect(requestBody.environment).to.equal(process.env.ENV)
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              expect(requestBody.user).to.equal(user)
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureMessage(message, level, user, () => {
          resolve()
        })
      })
    })
  })
  describe("logger.captureMessage(message, level, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        const level = "info" as CaptureLevel
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.level).to.equal(level)
              expect(requestBody.message).to.equal(message)
              expect(requestBody.environment).to.equal(process.env.ENV)
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureMessage(message, level, () => {
          resolve()
        })
      })
    })
  })
  describe("logger.captureMessage(message, callback)", () => {
    it("should send captured exception to sentry", () => {
      return new Promise((resolve, reject) => {
        const message = "foo"
        nock("https://sentry.io")
          .post("/api/3926156/store/")
          .reply((uri, requestBody: any) => {
            try {
              expect(requestBody.message).to.equal(message)
              expect(requestBody.environment).to.equal(process.env.ENV)
              expect(requestBody.release).to.equal(git.long())
              expect(requestBody.tags).to.equal({ hostname: hostname() })
              return [200]
            } catch (error) {
              reject(error)
            }
          })
        logger.captureMessage(message, () => {
          resolve()
        })
      })
    })
  })
})
