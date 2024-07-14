import type { StateCreator, StoreApi, StoreMutatorIdentifier } from 'zustand';
import { proxy, snapshot, subscribe } from 'valtio/vanilla';

type AnyFunction = (...args: never[]) => unknown;

type DeepWritable<T> = T extends object
  ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
  : T;

// TODO replace with Valtio's Snapshot type in v2
type Snapshot<T> = T extends AnyFunction
  ? T
  : T extends object
    ? { readonly [K in keyof T]: Snapshot<T[K]> }
    : T;

type StoreWithProxy<T> = {
  getProxyState: () => T;
};

type Write<T, U> = Omit<T, keyof U> & U;

type WithWithProxy<S, _A> = S extends { getState: () => Snapshot<infer T> }
  ? Write<S, StoreWithProxy<DeepWritable<T>>>
  : never;

declare module 'zustand/vanilla' {
  interface StoreMutators<S, A> {
    'zustand-valtio': WithWithProxy<S, A>;
  }
}

type WithProxy = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initialObject: T,
) => StateCreator<Snapshot<T>, Mps, [['zustand-valtio', never], ...Mcs]>;

type WithProxyImpl = <T extends object>(
  initialObject: T,
) => StateCreator<Snapshot<T>, [], []>;

const isObject = (x: unknown): x is object =>
  typeof x === 'object' && x !== null && !(x instanceof Promise);

const patchObjectMethods = <T extends object>(
  proxyObject: T,
  fn: (obj: object, key: string, fn: AnyFunction) => void,
) => {
  (Object.getOwnPropertyNames(proxyObject) as (keyof T)[]).forEach((key) => {
    const value = proxyObject[key];
    if (typeof value === 'function') {
      fn(proxyObject, key as string, value as AnyFunction);
    } else if (isObject(value)) {
      patchObjectMethods(value, fn);
    }
  });
};

const applyChanges = <T extends object>(proxyObject: T, prev: T, next: T) => {
  (Object.getOwnPropertyNames(prev) as (keyof T)[]).forEach((key) => {
    if (!(key in next)) {
      delete proxyObject[key];
    } else if (Object.is(prev[key], next[key])) {
      // unchanged
    } else if (
      isObject(proxyObject[key]) &&
      isObject(prev[key]) &&
      isObject(next[key])
    ) {
      applyChanges(
        proxyObject[key] as unknown as object,
        prev[key] as unknown as object,
        next[key] as unknown as object,
      );
    } else {
      proxyObject[key] = next[key];
    }
  });
  (Object.keys(next) as (keyof T)[]).forEach((key) => {
    if (!(key in prev)) {
      proxyObject[key] = next[key];
    }
  });
};

const withProxyImpl: WithProxyImpl = (initialObject) => (set, get, api) => {
  const proxyState = proxy(initialObject);
  let mutating = 0;
  let updating = 0;
  const updateState = () => {
    if (!mutating) {
      ++updating;
      set(snapshot(proxyState) as Snapshot<typeof proxyState>, true);
      --updating;
    }
  };
  patchObjectMethods(proxyState, (obj, key, fn) => {
    Object.defineProperty(obj, key, {
      value: (...args: never[]) => {
        try {
          ++mutating;
          return fn.apply(obj, args);
        } finally {
          --mutating;
          updateState();
        }
      },
    });
  });
  type Api = StoreApi<unknown> & StoreWithProxy<typeof initialObject>;
  (api as Api).getProxyState = () => proxyState;
  subscribe(proxyState, updateState, true);
  api.subscribe(() => {
    if (!updating) {
      // HACK for persist hydration
      applyChanges(
        proxyState,
        snapshot(proxyState) as typeof proxyState,
        get() as typeof proxyState,
      );
    }
  });
  return snapshot(proxyState) as Snapshot<typeof proxyState>;
};

export const withProxy = withProxyImpl as unknown as WithProxy;
