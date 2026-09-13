import assert from "node:assert/strict";
import test from "node:test";

import { supportsBrowserPush } from "./notifications.js";

test("detects supported browser push environments", () => {
  assert.equal(
    supportsBrowserPush({
      window: {
        Notification: {
          permission: "default",
        },
        PushManager: function PushManager() {},
      },
      navigator: {
        serviceWorker: {},
      },
    }),
    true
  );
});

test("rejects browsers without service worker push support", () => {
  assert.equal(
    supportsBrowserPush({
      window: {
        Notification: {},
      },
      navigator: {},
    }),
    false
  );
});
