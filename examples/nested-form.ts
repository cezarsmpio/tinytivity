import { createState } from "../index.ts";

const [form, watchForm] = createState({
  name: "",
  address: { city: "" },
  tags: [] as string[],
});

watchForm((current) => {
  console.log("form updated:", current.value);
});

// Nested property assignment is reactive.
form.value.name = "Alice";
form.value.address.city = "NYC";

// Mutating an array in place does NOT notify watchers.
form.value.tags.push("vip");
console.log("tags after push (no watcher fired):", form.value.tags);

// Reassigning the array does notify watchers.
form.value.tags = [...form.value.tags, "admin"];
