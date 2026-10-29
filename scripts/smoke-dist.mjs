import assert from "node:assert/strict";
import { createRequire } from "node:module";

// Self-reference resolves through the package "exports" map, exercising the
// same entry point npm consumers get.
const { createState, watch } = await import("tinytivity");

// Node.js 26 can require() an ESM package, so CommonJS consumers get the same API.
const require = createRequire(import.meta.url);
const commonjs = require("tinytivity");
assert.strictEqual(typeof commonjs.createState, "function");
assert.strictEqual(typeof commonjs.watch, "function");

const [count, watchCount] = createState(0);
const notifications = [];

const unwatch = watchCount((current, previous) => {
  notifications.push([current.value, previous?.value ?? null]);
});

count.value = 1;
unwatch();
count.value = 2;

assert.deepStrictEqual(notifications, [[1, 0]]);
assert.strictEqual(count.value, 2);

const [appName] = createState("tinytivity");
const [user] = createState({ name: "Alice" });
const snapshots = [];

watch([() => appName, () => user], (current) => {
  snapshots.push(current[0], current[1]);
});

user.value = { name: "Bob" };

assert.strictEqual(appName.value, "tinytivity");
assert.deepStrictEqual(snapshots, [
  { value: "tinytivity" },
  { value: { name: "Bob" } },
]);

console.log("dist smoke test passed: createState and watch load from the package export");
