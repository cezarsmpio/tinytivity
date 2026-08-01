import { createState, watch } from "../index.ts";

const [user] = createState({ name: "Alice" });
const [theme] = createState<"dark" | "light">("dark");

const unwatch = watch([() => user, () => theme], (current, previous) => {
  console.log("user:", current[0].value, "theme:", current[1].value);
  console.log("previous:", previous);
});

user.value = { name: "Bob" };
theme.value = "light";

unwatch();

// No longer notified after unwatch().
user.value = { name: "Carol" };
