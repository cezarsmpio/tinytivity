import { createState } from "../index.ts";

const [count, watchCount] = createState(0);

watchCount((current, previous) => {
  console.log(`count changed: ${previous?.value} -> ${current.value}`);
});

count.value = 1;
count.value = 2;
