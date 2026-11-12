import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { createState, watch } from "tinytivity";
import { waitFor } from "./utils.js";

const primitiveCases = [
  { label: "string", initial: "hello world", next: "goodbye world" },
  { label: "number", initial: 123, next: 456 },
  { label: "null", initial: null, next: "no longer null" },
  { label: "boolean", initial: true, next: false },
  { label: "undefined", initial: undefined, next: "no longer undefined" },
  { label: "symbol", initial: Symbol("a"), next: Symbol("b") },
];

const objectCases = [
  { label: "plain object", initial: { hello: "world" }, next: { hello: "there" } },
  { label: "array", initial: ["hello", "world"], next: ["goodbye"] },
  { label: "date", initial: new Date(0), next: new Date() },
  { label: "map", initial: new Map(), next: new Map([["a", 1]]) },
  { label: "set", initial: new Set(), next: new Set([1]) },
];

describe("createState", () => {
  for (const { label, initial } of primitiveCases) {
    it(`can read ${label} primitive value`, () => {
      const [state] = createState(initial);

      assert.deepStrictEqual(state.value, initial);
    });
  }

  for (const { label, initial } of objectCases) {
    it(`can read ${label} object value`, () => {
      const [state] = createState(initial);

      assert.deepStrictEqual(state.value, initial);
    });
  }

  for (const { label, initial, next } of primitiveCases) {
    it(`can mutate ${label} primitive value to a different value`, () => {
      const [state] = createState(initial);

      state.value = next;

      assert.deepStrictEqual(state.value, next);
    });
  }

  for (const { label, initial, next } of objectCases) {
    it(`can mutate ${label} object value to a different value`, () => {
      const [state] = createState(initial);

      state.value = next;

      assert.deepStrictEqual(state.value, next);
    });
  }

  it("can mutate nested object values", () => {
    const [state] = createState({ count: 0 });

    state.value.count = 1;

    assert.deepStrictEqual(state.value, { count: 1 });
  });

  it("reuses proxies for repeated nested object reads", () => {
    const [state] = createState({ user: { name: "Alice" } });

    assert.strictEqual(state.value.user, state.value.user);
  });
});

describe("watching a single state", () => {
  it("can watch mutations", async () => {
    const [state, watchState] = createState(0);

    await waitFor((resolve) => {
      watchState(() => {
        assert.deepStrictEqual(state.value, 1);
        resolve();
      });

      state.value = 1;
    });
  });

  it("can watch nested mutations", async () => {
    const [state, watchState] = createState({ count: 0 });

    await waitFor((resolve) => {
      watchState(() => {
        assert.deepStrictEqual(state.value.count, 1);
        resolve();
      });

      state.value.count = 1;
    });
  });

  it("watcher runs immediate", async () => {
    const [state, watchState] = createState(0);

    await waitFor((resolve) => {
      watchState(
        () => {
          assert.deepStrictEqual(state.value, 0);
          resolve();
        },
        { immediate: true },
      );

      state.value = 1;
    });
  });

  it("supports async watcher callbacks without awaiting them", async () => {
    const [state, watchState] = createState(0);
    let completedValue;

    watchState(async (current) => {
      await delay(10);
      completedValue = current.value;
    });

    state.value = 1;
    assert.strictEqual(completedValue, undefined);

    await delay(20);

    assert.strictEqual(completedValue, 1);
  });

  it("once async watchers unsubscribe when invoked", async () => {
    const [state, watchState] = createState(0);
    let callCount = 0;

    watchState(
      async () => {
        callCount++;
        await delay(10);
      },
      { once: true },
    );

    state.value = 1;
    state.value = 2;

    await delay(20);

    assert.strictEqual(callCount, 1);
  });

  it("unsubscribing an async watcher prevents later notifications", async () => {
    const [state, watchState] = createState(0);
    let callCount = 0;

    const unwatch = watchState(async () => {
      callCount++;
      await delay(20);
    });

    state.value = 1;
    unwatch();
    state.value = 2;

    await delay(30);

    assert.strictEqual(callCount, 1);
  });

  it("watcher runs only once", async () => {
    const [state, watchState] = createState(0);
    let callCount = 0;

    await waitFor((resolve) => {
      watchState(
        () => {
          callCount++;
          assert.deepStrictEqual(state.value, 1);
          resolve();
        },
        { once: true },
      );

      state.value = 1;
    });

    // second mutation should not re-trigger a "once" watcher
    state.value = 2;

    await delay(50);

    assert.strictEqual(callCount, 1);
  });

  it("unwatch stops future notifications", async () => {
    const [state, watchState] = createState(0);
    let callCount = 0;

    const unwatch = watchState(() => {
      callCount++;
    });

    state.value = 1;
    unwatch();
    state.value = 2;

    await delay(50);

    assert.strictEqual(callCount, 1);
  });

  it("preserves the latest value after unobserved mutations", () => {
    const [state, watchState] = createState(0);

    state.value = 1;

    watchState((current, previous) => {
      assert.deepStrictEqual(current.value, 2);
      assert.deepStrictEqual(previous?.value, 1);
    });

    state.value = 2;
  });

  it("once removes only the matching watcher", () => {
    const [state, watchState] = createState(0);
    let onceCalls = 0;
    let regularCalls = 0;

    watchState(() => onceCalls++, { once: true });
    watchState(() => regularCalls++);

    state.value = 1;
    state.value = 2;

    assert.strictEqual(onceCalls, 1);
    assert.strictEqual(regularCalls, 2);
  });

  it("once watcher is removed when its callback throws", () => {
    const [state, watchState] = createState(0);
    let callCount = 0;

    watchState(
      () => {
        callCount++;
        throw new Error("watcher failed");
      },
      { once: true },
    );

    assert.throws(
      () => {
        state.value = 1;
      },
      { name: "Error", message: /watcher failed/ },
    );
    state.value = 2;

    assert.strictEqual(callCount, 1);
  });

  it("immediate once watcher is removed when its callback throws", () => {
    const [, watchState] = createState(0);
    let callCount = 0;

    assert.throws(
      () => {
        watchState(
          () => {
            callCount++;
            throw new Error("watcher failed");
          },
          { immediate: true, once: true },
        );
      },
      { name: "Error", message: /watcher failed/ },
    );

    assert.strictEqual(callCount, 1);
  });

  it("can unsubscribe another watcher during notification", () => {
    const [state, watchState] = createState(0);
    let secondCalls = 0;

    let unsubscribeSecond = () => {};
    watchState(() => unsubscribeSecond());
    unsubscribeSecond = watchState(() => secondCalls++);

    state.value = 1;

    assert.strictEqual(secondCalls, 0);
  });

  it("multiple watchers are notified independently", async () => {
    const [state, watchState] = createState(0);
    let firstCallCount = 0;
    let secondCallCount = 0;

    const unwatchFirst = watchState(() => {
      firstCallCount++;
    });
    watchState(() => {
      secondCallCount++;
    });

    state.value = 1;
    unwatchFirst();
    state.value = 2;

    await delay(50);

    assert.strictEqual(firstCallCount, 1);
    assert.strictEqual(secondCallCount, 2);
  });

  it("immediate and once combined only fire once total", async () => {
    const [state, watchState] = createState(0);
    let callCount = 0;

    watchState(
      () => {
        callCount++;
      },
      { immediate: true, once: true },
    );

    state.value = 1;

    await delay(50);

    assert.strictEqual(callCount, 1);
  });

  it("watcher receives current and previous values", async () => {
    const [state, watchState] = createState(0);

    await waitFor((resolve) => {
      watchState((current, previous) => {
        assert.deepStrictEqual(current, { value: 1 });
        assert.deepStrictEqual(previous, { value: 0 });
        resolve();
      });

      state.value = 1;
    });
  });

  it("mutating a non-plain nested value in place does not notify watchers", async () => {
    const [state, watchState] = createState({ items: [] });
    let callCount = 0;

    watchState(() => {
      callCount++;
    });

    state.value.items.push(1);

    await delay(50);

    assert.strictEqual(callCount, 0);
    assert.deepStrictEqual(state.value.items, [1]);
  });
});

describe("watch()", () => {
  it("notifies when any of multiple sources change", async () => {
    const [user] = createState({ name: "Alice" });
    const [settings] = createState({ theme: "dark" });
    let callCount = 0;

    watch([() => user, () => settings], () => {
      callCount++;
    });

    user.value = { name: "Bob" };
    settings.value = { theme: "light" };

    await delay(50);

    assert.strictEqual(callCount, 2);
  });

  it("preserves unchanged source values", () => {
    const [first] = createState("first");
    const [second] = createState("second");

    watch([() => first, () => second], (current) => {
      assert.strictEqual(current[0].value, "first");
      assert.strictEqual(current[1].value, "updated");
    });

    second.value = "updated";
  });

  it("previous is null on the first change without immediate", async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });

    await waitFor((resolve) => {
      watch([() => appName, () => user], (current, previous) => {
        assert.deepStrictEqual(current, [
          { value: "tinytivity" },
          { value: { name: "Bob" } },
        ]);
        assert.strictEqual(previous, null);
        resolve();
      });

      user.value = { name: "Bob" };
    });
  });

  it("previous reflects the last known values on later changes", async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });
    let callCount = 0;

    await waitFor((resolve) => {
      watch([() => appName, () => user], (current, previous) => {
        callCount++;

        if (callCount === 2) {
          assert.deepStrictEqual(current, [
            { value: "tinytivity" },
            { value: { name: "Carol" } },
          ]);
          assert.deepStrictEqual(previous, [
            { value: "tinytivity" },
            { value: { name: "Bob" } },
          ]);
          resolve();
        }
      });

      user.value = { name: "Bob" };
      user.value = { name: "Carol" };
    });
  });

  it("immediate option fires once at registration", async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });
    let callCount = 0;

    watch(
      [() => appName, () => user],
      (current, previous) => {
        callCount++;
        assert.deepStrictEqual(current, [
          { value: "tinytivity" },
          { value: { name: "Alice" } },
        ]);
        assert.strictEqual(previous, null);
      },
      { immediate: true },
    );

    await delay(50);

    assert.strictEqual(callCount, 1);
  });

  it("once option fires only once total across all sources", async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });
    let callCount = 0;

    watch(
      [() => appName, () => user],
      () => {
        callCount++;
      },
      { once: true },
    );

    appName.value = "changed";
    user.value = { name: "Bob" };

    await delay(50);

    assert.strictEqual(callCount, 1);
  });

  it("unsubscribe stops notifications from all sources", async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });
    let callCount = 0;

    const unsubscribe = watch([() => appName, () => user], () => {
      callCount++;
    });

    unsubscribe();
    appName.value = "changed";
    user.value = { name: "Bob" };

    await delay(50);

    assert.strictEqual(callCount, 0);
  });

  it("throws when a source was not created via createState()", () => {
    assert.throws(
      () => {
        watch([() => ({ value: "not a real state" })], () => {});
      },
      { name: "Error", message: /watch\(\): source was not created via createState\(\)/ },
    );
  });
});
