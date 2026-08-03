# Examples

Runnable examples for `tinytivity`. Most files can be run directly with Deno:

```sh
deno run examples/counter.ts
deno run examples/nested-form.ts
deno run examples/combined-states.ts
deno run examples/unsubscribe.ts
deno run --allow-net examples/fetch-user.ts
deno run examples/handlebars.ts
deno run examples/pagination.ts
```

- [`counter.ts`](./counter.ts) - the basics: creating a state, watching it, updating it.
- [`nested-form.ts`](./nested-form.ts) - nested object state, and the array-mutation limitation.
- [`combined-states.ts`](./combined-states.ts) - combining multiple independent states with `watch()`.
- [`unsubscribe.ts`](./unsubscribe.ts) - `once`, `immediate`, and manual unsubscribing.
- [`dom-counter.ts`](./dom-counter.ts) - updating the DOM from a watcher. This one targets a browser, so it needs a real `document`. Load it from an HTML page instead of running it with `deno run`.
- [`fetch-user.ts`](./fetch-user.ts) - fetching a user from a real API and tracking idle/loading/success/error state. Needs `--allow-net`.
- [`handlebars.ts`](./handlebars.ts) - using Handlebar templates to render dynamic contet.
- [`pagination.ts`](./pagination.ts) - paginating a product list, combining a status flag with page, page size, and total count.
