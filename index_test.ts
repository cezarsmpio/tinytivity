import { assertEquals, assertThrows } from "@std/assert";
import { delay } from "@std/async";
import { createState, watch } from "./index.ts";
import { waitFor } from "./test_utils.ts";

const primitiveCases: Array<[string, unknown, unknown]> = [
  ["string", "hello world", "goodbye world"],
  ["number", 123, 456],
  ["null", null, "no longer null"],
  ["boolean", true, false],
  ["undefined", undefined, "no longer undefined"],
  ["symbol", Symbol("a"), Symbol("b")],
];

const objectCases: Array<[string, unknown, unknown]> = [
  ["plain object", { hello: "world" }, { hello: "there" }],
  ["array", ["hello", "world"], ["goodbye"]],
  ["date", new Date(0), new Date()],
  ["map", new Map(), new Map([["a", 1]])],
  ["set", new Set(), new Set([1])],
];

Deno.test.each(primitiveCases)(
  "can read %s primitive value",
  (_label, initial) => {
    const [state] = createState(initial);

    assertEquals(state.value, initial);
  },
);

Deno.test.each(objectCases)("can read %s object value", (_label, initial) => {
  const [state] = createState(initial);

  assertEquals(state.value, initial);
});

Deno.test.each(primitiveCases)(
  "can mutate %s primitive value to a different value",
  (_label, initial, next) => {
    const [state] = createState(initial);

    state.value = next;

    assertEquals(state.value, next);
  },
);

Deno.test.each(objectCases)(
  "can mutate %s object value to a different value",
  (_label, initial, next) => {
    const [state] = createState(initial);

    state.value = next;

    assertEquals(state.value, next);
  },
);

Deno.test("can mutate nested object values", () => {
  const [state] = createState({ count: 0 });

  state.value.count = 1;

  assertEquals(state.value, { count: 1 });
});

Deno.test("can watch mutations", async () => {
  const [state, watch] = createState(0);

  await waitFor((resolve) => {
    watch(() => {
      assertEquals(state.value, 1);
      resolve();
    });

    state.value = 1;
  });
});

Deno.test("can watch nested mutations", async () => {
  const [state, watch] = createState({ count: 0 });

  await waitFor((resolve) => {
    watch(() => {
      assertEquals(state.value.count, 1);
      resolve();
    });

    state.value.count = 1;
  });
});

Deno.test("watcher runs immediate", async () => {
  const [state, watch] = createState(0);

  await waitFor((resolve) => {
    watch(
      () => {
        assertEquals(state.value, 0);
        resolve();
      },
      { immediate: true },
    );

    state.value = 1;
  });
});

Deno.test("watcher runs only once", async () => {
  const [state, watch] = createState(0);
  let callCount = 0;

  await waitFor((resolve) => {
    watch(
      () => {
        callCount++;
        assertEquals(state.value, 1);
        resolve();
      },
      { once: true },
    );

    state.value = 1;
  });

  // second mutation should not re-trigger a "once" watcher
  state.value = 2;

  await delay(50);

  assertEquals(callCount, 1);
});

Deno.test("unwatch stops future notifications", async () => {
  const [state, watch] = createState(0);
  let callCount = 0;

  const unwatch = watch(() => {
    callCount++;
  });

  state.value = 1;
  unwatch();
  state.value = 2;

  await delay(50);

  assertEquals(callCount, 1);
});

Deno.test("multiple watchers are notified independently", async () => {
  const [state, watch] = createState(0);
  let firstCallCount = 0;
  let secondCallCount = 0;

  const unwatchFirst = watch(() => {
    firstCallCount++;
  });
  watch(() => {
    secondCallCount++;
  });

  state.value = 1;
  unwatchFirst();
  state.value = 2;

  await delay(50);

  assertEquals(firstCallCount, 1);
  assertEquals(secondCallCount, 2);
});

Deno.test("immediate and once combined only fire once total", async () => {
  const [state, watch] = createState(0);
  let callCount = 0;

  watch(
    () => {
      callCount++;
    },
    { immediate: true, once: true },
  );

  state.value = 1;

  await delay(50);

  assertEquals(callCount, 1);
});

Deno.test("watcher receives current and previous values", async () => {
  const [state, watch] = createState(0);

  await waitFor((resolve) => {
    watch((current, previous) => {
      assertEquals(current, { value: 1 });
      assertEquals(previous, { value: 0 });
      resolve();
    });

    state.value = 1;
  });
});

Deno.test(
  "mutating a non-plain nested value in place does not notify watchers",
  async () => {
    const [state, watch] = createState({ items: [] as number[] });
    let callCount = 0;

    watch(() => {
      callCount++;
    });

    state.value.items.push(1);

    await delay(50);

    assertEquals(callCount, 0);
    assertEquals(state.value.items, [1]);
  },
);

Deno.test("watch() notifies when any of multiple sources change", async () => {
  const [user] = createState({ name: "Alice" });
  const [settings] = createState({ theme: "dark" });
  let callCount = 0;

  watch([() => user, () => settings], () => {
    callCount++;
  });

  user.value = { name: "Bob" };
  settings.value = { theme: "light" };

  await delay(50);

  assertEquals(callCount, 2);
});

Deno.test(
  "watch() previous is null on the first change without immediate",
  async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });

    await waitFor((resolve) => {
      watch([() => appName, () => user], (current, previous) => {
        assertEquals(current, [
          { value: "tinytivity" },
          { value: { name: "Bob" } },
        ]);
        assertEquals(previous, null);
        resolve();
      });

      user.value = { name: "Bob" };
    });
  },
);

Deno.test(
  "watch() previous reflects the last known values on later changes",
  async () => {
    const [appName] = createState("tinytivity");
    const [user] = createState({ name: "Alice" });
    let callCount = 0;

    await waitFor((resolve) => {
      watch([() => appName, () => user], (current, previous) => {
        callCount++;

        if (callCount === 2) {
          assertEquals(current, [
            { value: "tinytivity" },
            { value: { name: "Carol" } },
          ]);
          assertEquals(previous, [
            { value: "tinytivity" },
            { value: { name: "Bob" } },
          ]);
          resolve();
        }
      });

      user.value = { name: "Bob" };
      user.value = { name: "Carol" };
    });
  },
);

Deno.test("watch() immediate option fires once at registration", async () => {
  const [appName] = createState("tinytivity");
  const [user] = createState({ name: "Alice" });
  let callCount = 0;

  watch(
    [() => appName, () => user],
    (current, previous) => {
      callCount++;
      assertEquals(current, [
        { value: "tinytivity" },
        { value: { name: "Alice" } },
      ]);
      assertEquals(previous, null);
    },
    { immediate: true },
  );

  await delay(50);

  assertEquals(callCount, 1);
});

Deno.test(
  "watch() once option fires only once total across all sources",
  async () => {
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

    assertEquals(callCount, 1);
  },
);

Deno.test(
  "watch() unsubscribe stops notifications from all sources",
  async () => {
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

    assertEquals(callCount, 0);
  },
);

Deno.test(
  "watch() throws when a source was not created via createState()",
  () => {
    assertThrows(
      () => {
        watch([() => ({ value: "not a real state" })], () => {});
      },
      Error,
      "watch(): source was not created via createState()",
    );
  },
);
