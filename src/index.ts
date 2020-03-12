"use strict"

import dotenv from "dotenv"
import git from "git-rev-sync"
import * as sentry from "@sentry/node"
import { hostname } from "os"
import util from "util"

dotenv.config()

var sensitiveKeys: string[] = []
if (process.env.LOGGER_SENSITIVE_KEYS) {
  sensitiveKeys = process.env.LOGGER_SENSITIVE_KEYS.split(",")
}

const filter = function(extra: any) {
  Object.keys(extra).forEach(function(key) {
    if (sensitiveKeys.includes(key)) {
      extra[key] = "[Filtered]"
    } else if (extra[key] instanceof Object) {
      extra[key] = filter(extra[key])
    }
  })
  return extra
}

export type CaptureLevel = "debug" | "info" | "warning" | "error" | "fatal"
interface CaptureUser {
  id: number | string
  email: string
}
interface CaptureExtra {
  [key: string]: string | number | object
}
type CaptureCallback = () => void

class Logger {
  private sentryEnabled: boolean
  constructor() {
    if (process.env.SENTRY_DSN) {
      sentry.init({
        debug: process.env.DEBUG === "true" ? true : false,
        dsn: process.env.SENTRY_DSN,
        release: git.long(),
        environment: process.env.ENV,
        beforeSend: event => {
          // Filter out sensitive keys
          if (event.extra instanceof Object) {
            event.extra = filter(event.extra)
          }
          return event
        },
      })
      this.sentryEnabled = true
    }
  }
  listSensitiveKeys() {
    return sensitiveKeys
  }
  captureException(
    exception: any,
    user?: CaptureUser,
    extra?: CaptureExtra,
    callback?: CaptureCallback
  ) {
    if (typeof user === "function") {
      callback = user
      user = null
      extra = null
    } else if (typeof extra === "function") {
      callback = extra
      extra = null
    }
    if (process.env.DEBUG === "true") {
      this.log("Capture exception")
      this.log({ exception, user, extra })
    }
    if (this.sentryEnabled) {
      sentry.withScope(scope => {
        scope.setTag("hostname", hostname())
        if (user) {
          scope.setUser(user as sentry.User)
        }
        if (extra !== null && extra instanceof Object) {
          Object.keys(extra).forEach(function(key) {
            scope.setExtra(key, extra[key])
          })
        }
        sentry.captureException(exception)
        let client = sentry.getCurrentHub().getClient()
        if (client && callback) {
          // Wait for Sentry to send events, then execute callback
          client.flush(2000).then(callback)
        }
      })
    } else if (callback) {
      callback()
    }
  }
  captureMessage(
    message: string,
    level: CaptureLevel,
    user?: CaptureUser,
    extra?: CaptureExtra,
    callback?: CaptureCallback
  ) {
    if (typeof level === "function") {
      callback = level
      level = null
    } else if (typeof user === "function") {
      callback = user
      user = null
    } else if (typeof extra === "function") {
      callback = extra
      extra = null
    }
    if (process.env.DEBUG === "true") {
      this.log("Capture message")
      this.log({ message, level, user, extra })
    }
    if (this.sentryEnabled) {
      sentry.withScope(scope => {
        scope.setTag("hostname", hostname())
        if (user) {
          scope.setUser(user as sentry.User)
        }
        if (extra !== null && extra instanceof Object) {
          Object.keys(extra).forEach(function(key) {
            scope.setExtra(key, extra[key])
          })
        }
        sentry.captureMessage(message, level as sentry.Severity)
        let client = sentry.getCurrentHub().getClient()
        if (client && callback) {
          // Wait for Sentry to send events, then execute callback
          client.flush(2000).then(callback)
        }
      })
    } else if (callback) {
      callback()
    }
  }
  log(...args: any[]) {
    args.forEach(function(arg) {
      console.log(util.inspect(arg, false, 20, true))
    })
    console.log() // Add line break for readability
  }
}

export default new Logger()
