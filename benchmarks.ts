import { createState, watch } from "./index.ts";

let sink = 0;

Deno.bench("createState", () => {
  const [state] = createState(0);
  sink += state.value;
});

const [readState] = createState(0);
Deno.bench("read state value", () => {
  sink += readState.value;
});

const [assignState] = createState(0);
Deno.bench("assign state value", () => {
  assignState.value++;
});

const [watchedState, watchWatchedState] = createState(0);
watchWatchedState((current) => {
  sink += current.value;
});
Deno.bench("assign state value with one watcher", () => {
  watchedState.value++;
});

const [nestedState] = createState({ count: 0 });
Deno.bench("assign nested state value", () => {
  nestedState.value.count++;
});

const [fanoutState, watchFanoutState] = createState(0);
for (let index = 0; index < 10; index++) {
  watchFanoutState((current) => {
    sink += current.value;
  });
}
Deno.bench("assign state value with ten watchers", () => {
  fanoutState.value++;
});

const [firstState] = createState(0);
const [secondState] = createState(0);
watch([() => firstState, () => secondState], (current) => {
  sink += current[0].value + current[1].value;
});
Deno.bench("assign state value with combined watcher", () => {
  firstState.value++;
});
