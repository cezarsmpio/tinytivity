// This example targets a browser, not Deno - it needs a real `document`.
// Bundle it or load it from an HTML page with <script type="module" src="./dom-counter.ts"></script>.
import { createState } from "@cezarsmpio/tinytivity";

const [count, watchCount] = createState(0);

const output = document.createElement("p");
const increment = document.createElement("button");
const decrement = document.createElement("button");

increment.textContent = "+1";
decrement.textContent = "-1";

increment.addEventListener("click", () => {
  count.value += 1;
});

decrement.addEventListener("click", () => {
  count.value -= 1;
});

// Update the DOM every time the state changes, plus once up front to paint the initial value.
watchCount(
  (current) => {
    output.textContent = `Count: ${current.value}`;
  },
  { immediate: true },
);

document.body.append(output, increment, decrement);
