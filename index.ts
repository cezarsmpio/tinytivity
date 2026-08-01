export type WatcherOptions = {
  immediate?: boolean;
  once?: boolean;
};

export type WatcherCallback<T> = (
  current: ReactiveObject<T>,
  previous: ReactiveObject<T> | null,
) => void;

export type InternalWatcher<T> = {
  callback: WatcherCallback<T>;
  options: WatcherOptions;
  key: symbol;
};

export type Watcher<T> = (
  callback: WatcherCallback<T>,
  options?: WatcherOptions,
) => () => void;

export type ReactiveObject<T> = {
  value: T;
};

function isObject(value: unknown): value is Record<PropertyKey, unknown> {
  if (typeof value !== "object") return false;
  if (value === null) return false;
  if (Array.isArray(value)) return false;

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

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

  return [state, watch];
}
