/** Options controlling when a watcher callback fires. */
export type WatcherOptions = {
  immediate?: boolean;
  once?: boolean;
};

/** Callback invoked with the current and previous state when a watched value changes. */
export type WatcherCallback<T> = (
  current: ReactiveObject<T>,
  previous: ReactiveObject<T> | null,
) => void;

/** Internal bookkeeping entry for a single registered watcher. */
export type InternalWatcher<T> = {
  callback: WatcherCallback<T>;
  options: WatcherOptions;
  key: symbol;
};

/** Registers a callback to run when the paired state changes; returns an unsubscribe function. */
export type Watcher<T> = (
  callback: WatcherCallback<T>,
  options?: WatcherOptions,
) => () => void;

/** A reactive value container returned by createState(). */
export type ReactiveObject<T> = {
  value: T;
};

/** A getter that resolves to a state's ReactiveObject, used as a watch() source. */
export type WatchGetter<T> = () => ReactiveObject<T>;

/** Tuple of current/previous snapshots, one per watch() source, matching the sources' order. */
export type WatchValues<TSources extends readonly WatchGetter<unknown>[]> = {
  [K in keyof TSources]: TSources[K] extends WatchGetter<infer T>
    ? ReactiveObject<T>
    : never;
};

/** Callback invoked with the current and previous values of all watch() sources. */
export type WatchCallback<TSources extends readonly WatchGetter<unknown>[]> = (
  current: WatchValues<TSources>,
  previous: WatchValues<TSources> | null,
) => void;

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  if (Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const stateWatchers = new WeakMap<ReactiveObject<unknown>, Watcher<unknown>>();

/** Creates a reactive state container along with a watcher for that state. */
export function createState<T>(
  initialState: T,
): [ReactiveObject<T>, Watcher<T>] {
  const watchers = new Map<symbol, InternalWatcher<T>>();

  function reactive<TTarget extends object>(target: TTarget): TTarget {
    return new Proxy(target, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);

        return isObject(value) ? reactive(value) : value;
      },
      set(target, key, newValue, receiver) {
        const previous = { ...state };
        const didSet = Reflect.set(target, key, newValue, receiver);

        if (didSet) {
          notify({ ...state }, previous);
        }

        return didSet;
      },
    });
  }

  function notify(current: ReactiveObject<T>, previous: ReactiveObject<T>) {
    watchers.forEach(({ callback, options, key }) => {
      callback(current, previous);

      if (options.once) {
        watchers.delete(key);
      }
    });
  }

  function watch(callback: WatcherCallback<T>, options: WatcherOptions = {}) {
    const key = Symbol();
    watchers.set(key, { callback, options, key });

    if (options?.immediate) {
      const current = { ...state };
      callback(current, null);

      if (options?.once) {
        watchers.delete(key);
      }
    }

    return () => {
      watchers.delete(key);
    };
  }

  const state = reactive({
    value: initialState,
  });

  stateWatchers.set(state, watch as Watcher<unknown>);

  return [state, watch];
}

/** Watches whole states created independently via createState, combining their changes into one callback. */
export function watch<TSources extends readonly WatchGetter<unknown>[]>(
  sources: TSources,
  callback: WatchCallback<TSources>,
  options: WatcherOptions = {},
): () => void {
  const states = sources.map((getState) => getState());

  const sourceWatchers = states.map((sourceState) => {
    const sourceWatcher = stateWatchers.get(sourceState);
    if (!sourceWatcher) {
      throw new Error("watch(): source was not created via createState()");
    }
    return sourceWatcher;
  });

  let previous: WatchValues<TSources> | null = null;

  function unsubscribeAll() {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  function handleChange() {
    const current = states.map((sourceState) => ({
      ...sourceState,
    })) as WatchValues<TSources>;

    callback(current, previous);
    previous = current;

    if (options.once) {
      unsubscribeAll();
    }
  }

  const unsubscribes = sourceWatchers.map((sourceWatcher) =>
    sourceWatcher(handleChange),
  );

  if (options.immediate) {
    handleChange();
  }

  return unsubscribeAll;
}
