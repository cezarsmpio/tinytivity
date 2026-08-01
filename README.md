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

---

Made by Humans + AI. Embrace the future.
