import { createState } from "../index.ts";

const [count, watchCount] = createState(0);

// `immediate` fires right away with `previous` as null.
watchCount(
  (current, previous) => console.log("immediate:", current.value, previous),
  {
    immediate: true,
  },
);

// `once` auto-unsubscribes after the first call.
watchCount((current) => console.log("once:", current.value), { once: true });

// Manual unsubscribe.
const unwatch = watchCount((current) => console.log("manual:", current.value));

count.value = 1; // triggers "once" and "manual"
unwatch();
count.value = 2; // triggers neither "once" (already fired) nor "manual" (unsubscribed)
