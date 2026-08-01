# Examples

Runnable examples for `tinytivity`. Each file can be run directly with Deno:

```sh
deno run examples/counter.ts
deno run examples/nested-form.ts
deno run examples/combined-states.ts
deno run examples/unsubscribe.ts
```

- [`counter.ts`](./counter.ts) — the basics: creating a state, watching it, updating it.
- [`nested-form.ts`](./nested-form.ts) — nested object state, and the array-mutation limitation.
- [`combined-states.ts`](./combined-states.ts) — combining multiple independent states with `watch()`.
- [`unsubscribe.ts`](./unsubscribe.ts) — `once`, `immediate`, and manual unsubscribing.
