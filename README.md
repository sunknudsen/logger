# logger

## Logging utility used by a few of my projects.

This package abstracts `console.log` and [@sentry/node](https://www.npmjs.com/package/@sentry/node).

`logger.log` is a more beautiful version of `console.log`.

`logger.listSensitiveKeys` returns an array of comma-separated values found in `process.env.LOGGER_SENSITIVE_KEYS`.

`logger.captureException` is a wrapper around @sentry/node’s `sentry.captureException`.

`logger.captureMessage` is a wrapper around @sentry/node’s `sentry.captureMessage`.

## Installation

```shell
npm install @sunknudsen/logger --save
```

## Configuration

Copy `.env.sample` to `.env`.

```shell
cp .env.sample .env
```

Configure your sentry [DSN](https://docs.sentry.io/error-reporting/quickstart/?platform=node#configure-the-sdk) using `SENTRY_DSN`.

Optionally use `LOGGER_SENSITIVE_KEYS` to filter sensitive keys (matching keys are replaced by `[Filtered]`), `DEBUG` to enable debugging and `ENV` to set your environement.

## Usage

### Log to `stdout`

```typescript
import logger from "@sunknudsen/logger"
// or `const logger = require("@sunknudsen/logger").default` for CommonJS

logger.log(new Error("BOOM"))
```

### List sensitive keys

```typescript
import logger from "@sunknudsen/logger"

logger.listSensitiveKeys()
```

### Capture exception

```typescript
import logger from "@sunknudsen/logger"

logger.captureException(
  new Error("BOOM"),
  {
    id: "4ceb2af5e87e444786f306e85fd2261f",
    email: "hello@example.com",
  },
  {
    foo: "bar",
  },
  () => {
    logger.log("Error sent to Sentry")
  }
)
```

### Capture message

```typescript
import logger from "@sunknudsen/logger"

logger.captureMessage(
  "User signup",
  "info",
  {
    id: "4ceb2af5e87e444786f306e85fd2261f",
    email: "hello@example.com",
  },
  {
    foo: "bar",
  },
  () => {
    logger.log("Message sent to Sentry")
  }
)
```

## Contributors

[Sun Knudsen](https://sunknudsen.com/)

## Licence

MIT
