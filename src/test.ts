"use strict"

import dotenv from "dotenv"
import { exec } from "child_process"
import { promisify } from "util"
import { expect } from "@hapi/code"
import lab from "@hapi/lab"
import logger from "./index"

dotenv.config()

const asyncExec = promisify(exec)

const { experiment, describe, it, after } = (exports.lab = lab.script())

const wait = function(delay: number) {
  return new Promise(resolve => setTimeout(resolve, delay))
}

experiment("logger", () => {
  describe("logger.listSensitiveKeys()", () => {
    it("should return sensitive keys", async () => {
      expect(logger.listSensitiveKeys()).to.equal(["access_token", "password"])
    })
  })
  describe("logger.log(string)", () => {
    it("should return string", async () => {
      let { stdout } = await asyncExec(
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
      let { stdout } = await asyncExec(
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
      let { stdout } = await asyncExec(
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
      let { stdout } = await asyncExec(
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
      let { stdout } = await asyncExec(
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
  // To do: add unit tests for logger.captureException and logger.captureMessage
})
