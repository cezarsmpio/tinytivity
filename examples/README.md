# Examples

Runnable examples for `tinytivity`. Run them directly with Node.js 26:

```sh
node examples/counter.ts
node examples/nested-form.ts
node examples/combined-states.ts
node examples/unsubscribe.ts
node examples/handlebars.ts
node examples/pagination.ts
node examples/fetch-user.ts
```

- [`counter.ts`](./counter.ts) - the basics: creating a state, watching it, updating it.
- [`nested-form.ts`](./nested-form.ts) - nested object state, and the array-mutation limitation.
- [`combined-states.ts`](./combined-states.ts) - combining multiple independent states with `watch()`.
- [`unsubscribe.ts`](./unsubscribe.ts) - `once`, `immediate`, and manual unsubscribing.
- [`dom-counter.ts`](./dom-counter.ts) - updating the DOM from a watcher. This one targets a browser, so it needs a real `document`. Load it from an HTML page instead of running it with Node.
- [`fetch-user.ts`](./fetch-user.ts) - fetching a user from a real API and tracking idle/loading/success/error state. Needs network access.
- [`handlebars.ts`](./handlebars.ts) - using Handlebars templates to render dynamic content. The `handlebars` package is a dev dependency, so run `npm install` first.
- [`pagination.ts`](./pagination.ts) - paginating a product list, combining a status flag with page, page size, and total count.
