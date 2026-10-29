import { bench } from "node:bench";
import { createState, watch } from "../src/index.ts";

/**
 * Every benchmark keeps its result observable outside the measured region so
 * V8 cannot optimize the work away.
 */
let sink = 0;

const CREATE_OPERATIONS = 10_000;
const READ_OPERATIONS = 100_000;
const NESTED_READ_OPERATIONS = 50_000;
const WRITE_OPERATIONS = 10_000;
const WATCHED_WRITE_OPERATIONS = 5_000;
const CREATE_SUM = (CREATE_OPERATIONS * (CREATE_OPERATIONS - 1)) / 2;
const NAME_LENGTH = "Alice".length;

bench("createState with primitive value", (context) => {
  context.start();
  let total = 0;

  for (let index = 0; index < CREATE_OPERATIONS; index++) {
    const [state] = createState(index);
    total += state.value;
  }

  context.end(CREATE_OPERATIONS);

  if (total !== CREATE_SUM) {
    throw new Error(`createState produced ${total}, expected ${CREATE_SUM}`);
  }

  sink += total;
});

bench("createState with nested object", (context) => {
  context.start();
  let total = 0;

  for (let index = 0; index < CREATE_OPERATIONS; index++) {
    const [state] = createState({ user: { name: "Alice" } });
    total += state.value.user.name.length + index;
  }

  context.end(CREATE_OPERATIONS);

  const expected = CREATE_SUM + CREATE_OPERATIONS * NAME_LENGTH;

  if (total !== expected) {
    throw new Error(`nested createState produced ${total}, expected ${expected}`);
  }

  sink += total;
});

const [readState] = createState(0);

bench("read state value", (context) => {
  readState.value++;

  context.start();
  let total = 0;

  for (let index = 0; index < READ_OPERATIONS; index++) {
    total += readState.value;
  }

  context.end(READ_OPERATIONS);

  const expected = READ_OPERATIONS * readState.value;

  if (total !== expected) {
    throw new Error(`state read produced ${total}, expected ${expected}`);
  }

  sink += total;
});

const [nestedReadState] = createState({
  user: { profile: { name: "Alice" } },
});

bench("read nested state value", (context) => {
  context.start();
  let total = 0;

  for (let index = 0; index < NESTED_READ_OPERATIONS; index++) {
    total += nestedReadState.value.user.profile.name.length;
  }

  context.end(NESTED_READ_OPERATIONS);

  const expected = NESTED_READ_OPERATIONS * NAME_LENGTH;

  if (total !== expected) {
    throw new Error(`nested read produced ${total}, expected ${expected}`);
  }

  sink += total;
});

const [assignState] = createState(0);

bench("assign state value", (context) => {
  const expected = assignState.value + WRITE_OPERATIONS;

  context.start();

  for (let index = 0; index < WRITE_OPERATIONS; index++) {
    assignState.value++;
  }

  context.end(WRITE_OPERATIONS);

  if (assignState.value !== expected) {
    throw new Error(`state assignment ended at ${assignState.value}, expected ${expected}`);
  }

  sink += assignState.value;
});

const [watchedState, watchWatchedState] = createState(0);

watchWatchedState((current) => {
  sink += current.value;
});

bench("assign state value with one watcher", (context) => {
  const expected = watchedState.value + WATCHED_WRITE_OPERATIONS;

  context.start();

  for (let index = 0; index < WATCHED_WRITE_OPERATIONS; index++) {
    watchedState.value++;
  }

  context.end(WATCHED_WRITE_OPERATIONS);

  if (watchedState.value !== expected) {
    throw new Error(`watched assignment ended at ${watchedState.value}, expected ${expected}`);
  }
});

const [nestedState] = createState({ count: 0 });

bench("assign nested state value", (context) => {
  const expected = nestedState.value.count + WRITE_OPERATIONS;

  context.start();

  for (let index = 0; index < WRITE_OPERATIONS; index++) {
    nestedState.value.count++;
  }

  context.end(WRITE_OPERATIONS);

  if (nestedState.value.count !== expected) {
    throw new Error(`nested assignment ended at ${nestedState.value.count}, expected ${expected}`);
  }

  sink += nestedState.value.count;
});

const [fanoutState, watchFanoutState] = createState(0);

for (let index = 0; index < 10; index++) {
  watchFanoutState((current) => {
    sink += current.value;
  });
}

bench("assign state value with ten watchers", (context) => {
  const expected = fanoutState.value + WATCHED_WRITE_OPERATIONS;

  context.start();

  for (let index = 0; index < WATCHED_WRITE_OPERATIONS; index++) {
    fanoutState.value++;
  }

  context.end(WATCHED_WRITE_OPERATIONS);

  if (fanoutState.value !== expected) {
    throw new Error(`fan-out assignment ended at ${fanoutState.value}, expected ${expected}`);
  }
});

const [firstState] = createState(0);
const [secondState] = createState(0);

watch([() => firstState, () => secondState], (current) => {
  sink += current[0]!.value + current[1]!.value;
});

bench("assign state value with combined watcher", (context) => {
  const expected = firstState.value + WATCHED_WRITE_OPERATIONS;

  context.start();

  for (let index = 0; index < WATCHED_WRITE_OPERATIONS; index++) {
    firstState.value++;
  }

  context.end(WATCHED_WRITE_OPERATIONS);

  if (firstState.value !== expected) {
    throw new Error(`combined assignment ended at ${firstState.value}, expected ${expected}`);
  }
});

process.on("exit", () => {
  if (!Number.isFinite(sink) || sink <= 0) {
    process.exitCode = 1;
    console.error(`benchmark sink is invalid: ${sink}`);
  }
});
