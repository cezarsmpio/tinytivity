# tinytivity

Create reactive states in JavaScript.

- Zero dependencies
- Super tiny
- Fully typed
- Built for Node.js 26

[![npm version](https://img.shields.io/npm/v/tinytivity.svg)](https://www.npmjs.com/package/tinytivity)
[![CI](https://github.com/cezarsmpio/tinytivity/actions/workflows/ci.yml/badge.svg)](https://github.com/cezarsmpio/tinytivity/actions/workflows/ci.yml)

> [!WARNING]
> Use this library in production at your own risk. It hasn't been battle-tested at scale and is meant for small applications, prototypes, and side projects, not mission-critical systems.

## Installation

```sh
npm install tinytivity
```

The package requires Node.js 26 or newer. It is ESM only and ships with TypeScript declarations.

If you used the JSR package before, replace `jsr:@cezarsmpio/tinytivity` with `tinytivity`. Deno projects can import it as `npm:tinytivity`.

## Usage

### Creating a state

`createState()` returns a tuple: a reactive object and a `watch` function scoped to it.

```ts
import { createState } from "tinytivity";

const [count, watchCount] = createState(0);

console.log(count.value); // 0
```

The reactive object always exposes its value through `.value`, whether the value is a primitive (`string`, `number`, `boolean`, `null`, `undefined`, `symbol`) or an object (`object`, `array`, `Map`, `Set`, `Date`, etc).

### Updating a state

Assign directly to `.value` to trigger reactivity:

```ts
count.value = 1;
```

### Nested changes

Plain objects (and plain objects nested inside them) are also reactive, so assigning to a nested property triggers watchers too:

```ts
const [user, watchUser] = createState({ name: "Alice", address: { city: "NYC" } });

user.value.name = "Bob"; // triggers watchers
user.value.address.city = "LA"; // nested changes work too
```

### Limitations

Only assignments are tracked. Mutating methods on arrays, `Map`, or `Set`, anything that changes internal state without going through a property `set`, are not detected:

```ts
const [items, watchItems] = createState({ list: [1, 2, 3] });

items.value.list.push(4); // does NOT notify watchers
items.value.list = [...items.value.list, 4]; // notifies watchers
```

The same applies to `Map`/`Set` mutator methods like `.set()`, `.add()`, `.delete()`, and `.clear()`. Reassign the whole value instead.

Non-plain objects (class instances, `Date`, `Map`, `Set`, etc.) are stored as-is and aren't made deeply reactive. Only plain objects (`{}`) are recursively wrapped.

### Watching a state

The `watch` function returned by `createState()` registers a callback that runs whenever that state changes, receiving the current and previous snapshot:

```ts
const [count, watchCount] = createState(0);

const unwatch = watchCount((current, previous) => {
  console.log(current.value, previous?.value);
});

count.value = 1; // logs: 1 0
```

Options:

- `immediate`: run the callback once immediately upon registration, with `previous` as `null`.
- `once`: automatically unsubscribe after the first call.

```ts
watchCount((current) => console.log(current.value), {
  immediate: true,
  once: true,
});
```

Watcher callbacks may be async, but notifications are not awaited:

```ts
watchCount(async (current) => {
  await saveCount(current.value);
});
```

The watcher is considered notified as soon as the callback returns its promise. Use `try/catch` inside the callback to handle async errors; rejected promises are not handled by `tinytivity`.

### Unsubscribing

Every `watch` call returns an unsubscribe function:

```ts
const unwatch = watchCount(() => {
  // ...
});

unwatch(); // stops receiving future notifications
```

### Combining multiple states

Use the standalone `watch()` function to observe several states created via `createState()` at once. It fires whenever any of the sources change, passing an array of current/previous snapshots in the same order as the sources:

```ts
import { createState, watch } from "tinytivity";

const [user] = createState({ name: "Alice" });
const [theme] = createState("dark");

const unwatch = watch([() => user, () => theme], (current, previous) => {
  console.log(current[0].value, current[1].value);
});

user.value = { name: "Bob" };
theme.value = "light";

unwatch();
```

It supports the same `immediate` and `once` options as the per-state watcher, and throws if any source wasn't created via `createState()`.

## Examples

See the [examples/](examples/) folder for runnable code samples, including a counter, a form-like nested state, combining multiple states, DOM updates, data fetching, and pagination.

Run any example directly with Node.js 26:

```sh
node examples/counter.ts
node examples/nested-form.ts
node examples/combined-states.ts
node examples/unsubscribe.ts
node examples/pagination.ts
```

`examples/fetch-user.ts` needs network access. `examples/handlebars.ts` uses the `handlebars` dev dependency that is installed with `npm install`. `examples/dom-counter.ts` targets the browser and needs a real `document`.

## Benchmarks

Node.js 26 includes a benchmark runner. Run the suite with:

```sh
npm run bench
```

The benchmark runner was added in Node.js 26.9, so use that version or newer to run the suite.

The suite covers primitive and nested state creation, reads, direct and nested assignments, watcher fan-out, and combined-state notifications. A sample run on 2026-10-28 using Node 26.10.0 on an Apple M2 produced:

| benchmark                                | samples | mean rate     | 95% CI                    | median rate   | warning       |
| ---------------------------------------- | ------- | ------------- | ------------------------- | ------------- | ------------- |
| createState with primitive value         | 50      | 6.89M ops/s   | 6.61M - 7.17M ops/s       | 6.83M ops/s   | noisy         |
| createState with nested object           | 50      | 2.82M ops/s   | 2.67M - 2.97M ops/s       | 2.89M ops/s   | noisy, skewed |
| read state value                         | 50      | 37.17M ops/s  | 36.67M - 37.67M ops/s     | 37.59M ops/s  |               |
| read nested state value                  | 50      | 6.10M ops/s   | 5.84M - 6.36M ops/s       | 6.45M ops/s   | noisy, skewed |
| assign state value                       | 50      | 5.16M ops/s   | 5.07M - 5.25M ops/s       | 5.24M ops/s   | noisy, skewed |
| assign state value with one watcher      | 50      | 1.06M ops/s   | 1.04M - 1.07M ops/s       | 1.06M ops/s   |               |
| assign nested state value                | 50      | 4.18M ops/s   | 4.11M - 4.25M ops/s       | 4.25M ops/s   | noisy         |
| assign state value with ten watchers     | 50      | 921.18k ops/s | 913.08k - 929.28k ops/s   | 921.58k ops/s |               |
| assign state value with combined watcher | 50      | 1.02M ops/s   | 1.01M - 1.04M ops/s       | 1.03M ops/s   | noisy, skewed |

Benchmark results vary with the Node.js version, operating system, and hardware. The `noisy` and `skewed` warnings come from the built-in reporter; rerun the suite or increase the sample count before comparing small differences.

## Development

The test suite runs TypeScript directly with Node's built-in test runner, so there is no build step during development:

```sh
npm install
npm test
npm run typecheck
npm run test:coverage
```

Build the publishable package and smoke test the output with:

```sh
npm run build
npm run test:dist
```

The published artifact contains `dist/index.js`, `dist/index.d.ts`, and source maps. Tests, benchmarks, and examples are not published.

## Releasing

Releases are automated with [semantic-release](https://github.com/semantic-release/semantic-release). Push a Conventional Commit to `main` and the release workflow analyzes the commits, updates `CHANGELOG.md` and `package.json`, publishes to npm with provenance, and creates a GitHub release.

The workflow needs an `NPM_TOKEN` repository secret with publish rights for the `tinytivity` package. After the first publish you can switch to npm trusted publishing and remove the token.

semantic-release pushes its release commit back to `main`, so GitHub Actions must be allowed to push to that branch. If branch protection blocks the bot, the release commit stays local to the runner and publishing fails.

Use `feat:`, `fix:`, `perf:`, or a `BREAKING CHANGE:` footer, depending on the change. Commits such as `chore:` and `docs:` do not create a release.

---

Made by Humans + AI. Embrace the future.
