/** Options controlling when a watcher callback fires. */
export type WatcherOptions = {
  immediate?: boolean;
  once?: boolean;
};

/** Callback invoked with the current and previous state when a watched value changes. */
export type WatcherCallback<T> = (
  current: ReactiveObject<T>,
  previous: ReactiveObject<T> | null,
) => unknown;

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
) => unknown;

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  if (Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

const stateWatchers = new WeakMap<
  ReactiveObject<unknown>,
  Set<InternalWatcher<unknown>>
>();
const knownStates = new WeakSet<ReactiveObject<unknown>>();

function getWatchers<T>(state: ReactiveObject<T>): Set<InternalWatcher<T>> {
  const stateKey = state as ReactiveObject<unknown>;
  let watchers = stateWatchers.get(stateKey);

  if (!watchers) {
    watchers = new Set();
    stateWatchers.set(stateKey, watchers);
  }

  return watchers as Set<InternalWatcher<T>>;
}

function notify<T>(
  state: ReactiveObject<T>,
  current: ReactiveObject<T>,
  previous: ReactiveObject<T>,
  watchers = getWatchers(state),
) {
  watchers.forEach((watcher) => {
    const { callback, options } = watcher;
    try {
      callback(current, previous);
    } finally {
      if (options.once) {
        watchers.delete(watcher);
      }
    }
  });
}

function subscribe<T>(
  state: ReactiveObject<T>,
  callback: WatcherCallback<T>,
  options: WatcherOptions = {},
): () => void {
  const watchers = getWatchers(state);
  const key = Symbol();
  const watcher = { callback, options, key };
  watchers.add(watcher);

  if (options.immediate) {
    const current = { ...state };
    try {
      callback(current, null);
    } finally {
      if (options.once) {
        watchers.delete(watcher);
      }
    }
  }

  return () => {
    watchers.delete(watcher);
  };
}

/** Creates a reactive state container along with a watcher for that state. */
export function createState<T>(
  initialState: T,
): [ReactiveObject<T>, Watcher<T>] {
  let proxyCache: WeakMap<object, object> | undefined;

  function reactive<TTarget extends object>(
    target: TTarget,
    cache = true,
  ): TTarget {
    const cachedProxy = proxyCache?.get(target);
    if (cachedProxy) return cachedProxy as TTarget;

    const proxy = new Proxy(target, {
      get(target, key, receiver) {
        const value = Reflect.get(target, key, receiver);

        return isObject(value) ? reactive(value) : value;
      },
      set(target, key, newValue, receiver) {
        const watchers = stateWatchers.get(state);
        const previous = watchers?.size ? { ...state } : undefined;
        const didSet = Reflect.set(target, key, newValue, receiver);

        if (didSet && previous) {
          notify(state, { ...state }, previous, watchers);
        }

        return didSet;
      },
    });

    if (cache) {
      proxyCache ??= new WeakMap();
      proxyCache.set(target, proxy);
    }

    return proxy;
  }

  const state = reactive(
    {
      value: initialState,
    },
    false,
  );

  knownStates.add(state as ReactiveObject<unknown>);

  const watch: Watcher<T> = (callback, options) =>
    subscribe(state, callback, options);

  return [state, watch];
}

/** Watches whole states created independently via createState, combining their changes into one callback. */
export function watch<TSources extends readonly WatchGetter<unknown>[]>(
  sources: TSources,
  callback: WatchCallback<TSources>,
  options: WatcherOptions = {},
): () => void {
  const states = sources.map((getState) => getState());

  states.forEach((sourceState) => {
    if (!knownStates.has(sourceState)) {
      throw new Error("watch(): source was not created via createState()");
    }
  });

  let previous: WatchValues<TSources> | null = null;

  function unsubscribeAll() {
    unsubscribes.forEach((unsubscribe) => unsubscribe());
  }

  function handleChange(
    changedIndex?: number,
    changedCurrent?: ReactiveObject<unknown>,
  ) {
    const current = (
      previous
        ? [...previous]
        : states.map((sourceState) => ({ ...sourceState }))
    ) as Array<ReactiveObject<unknown>>;

    if (changedIndex !== undefined && changedCurrent) {
      current[changedIndex] = changedCurrent;
    }

    const typedCurrent = current as WatchValues<TSources>;
    callback(typedCurrent, previous);
    previous = typedCurrent;

    if (options.once) {
      unsubscribeAll();
    }
  }

  const unsubscribes = states.map((sourceState, index) =>
    subscribe(sourceState, (current) => handleChange(index, current)),
  );

  if (options.immediate) {
    handleChange();
  }

  return unsubscribeAll;
}
