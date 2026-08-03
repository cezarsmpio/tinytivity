# tinytivity

Create reactive states in JavaScript.

- Zero dependencies
- Super tiny
- Fully typed

> [!WARNING]
> Use this library in production at your own risk. It hasn't been battle-tested at scale and is meant for small applications, prototypes, and side projects, not mission-critical systems.

## Installation

`tinytivity` is published to [JSR](https://jsr.io) and works with npm-based package managers too.

### JSR (Deno, or any JSR-compatible runtime)

```sh
deno add jsr:@cezarsmpio/tinytivity
```

### npm (Node.js, Bun, etc.)

```sh
npx jsr add @cezarsmpio/tinytivity
```

Other npm-compatible package managers work the same way:

```sh
yarn dlx jsr add @cezarsmpio/tinytivity
pnpm dlx jsr add @cezarsmpio/tinytivity
```

## Usage

### Creating a state

`createState()` returns a tuple: a reactive object and a `watch` function scoped to it.

```ts
import { createState } from "@cezarsmpio/tinytivity";

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
user.value.address.city = "LA"; // triggers watchers, nested changes work too
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
import { createState, watch } from "@cezarsmpio/tinytivity";

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


## Benchmarks

Run the benchmark suite with Deno:

```sh
deno bench benchmarks.ts
```

The suite measures primitive and nested-object state creation, reads, direct and nested assignments, watcher fan-out, and combined-state notifications. A sample run on 2026-08-04 using Deno 2.9.4 on an Apple M2 produced:

| benchmark                                  | time/iter (avg) |        iter/s |      (min … max)      |      p75 |      p99 |     p995 |
| ------------------------------------------ | --------------- | ------------- | --------------------- | -------- | -------- | -------- |
| createState with primitive value           |        102.0 ns |     9,803,000 | ( 76.4 ns … 115.9 ns) | 107.5 ns | 111.0 ns | 114.0 ns |
| createState with nested object             |        240.0 ns |     4,167,000 | (227.7 ns … 281.9 ns) | 244.5 ns | 261.7 ns | 262.0 ns |
| read state value                           |         17.5 ns |    57,160,000 | ( 17.3 ns …  26.0 ns) |  17.4 ns |  20.4 ns |  20.6 ns |
| read nested state value                    |        100.2 ns |     9,985,000 | ( 99.3 ns … 111.9 ns) |  99.8 ns | 105.7 ns | 108.2 ns |
| assign state value                         |        158.5 ns |     6,308,000 | (157.8 ns … 173.3 ns) | 158.3 ns | 164.7 ns | 168.1 ns |
| assign state value with one watcher        |        735.4 ns |     1,360,000 | (730.4 ns … 756.9 ns) | 736.8 ns | 756.9 ns | 756.9 ns |
| assign nested state value                  |        191.2 ns |     5,229,000 | (189.5 ns … 208.9 ns) | 191.7 ns | 200.6 ns | 205.3 ns |
| assign state value with ten watchers       |        874.9 ns |     1,143,000 | (867.4 ns … 903.9 ns) | 876.8 ns | 903.9 ns | 903.9 ns |
| assign state value with combined watcher   |        756.9 ns |     1,321,000 | (750.5 ns … 786.3 ns) | 758.6 ns | 786.3 ns | 786.3 ns |

Benchmark results vary with the Deno version, operating system, and hardware. Re-run the command above when comparing changes.

---

Made by Humans + AI. Embrace the future.
