import type { StateCreator, StoreApi, StoreMutatorIdentifier } from 'zustand';
import { proxy, snapshot, subscribe } from 'valtio/vanilla';

// TODO replace with Valtio's Snapshot type in v2
type Snapshot<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends object
    ? { readonly [K in keyof T]: Snapshot<T[K]> }
    : T;

type StoreWithProxy<T> = {
  setState: never;
  getProxyState: () => T;
};

type Write<T, U> = Omit<T, keyof U> & U;

type WithWithProxy<S, _A> = S extends { getState: () => Snapshot<infer T> }
  ? Write<S, StoreWithProxy<DeepWritable<T>>>
  : never;

type DeepWritable<T> = T extends object
  ? { -readonly [K in keyof T]: DeepWritable<T[K]> }
  : T;

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
  type AnyObject = Record<string, unknown>;
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
  Object.keys(proxyState).forEach((key) => {
    const fn = (proxyState as AnyObject)[key];
    // TODO this doesn't handle nested objects
    if (typeof fn === 'function') {
      Object.defineProperty(proxyState, key, {
        value: (...args: unknown[]) => {
          try {
            ++mutating;
            return fn.apply(proxyState, args);
          } finally {
            --mutating;
            updateState();
          }
        },
      });
    }
  });
  type Api = StoreApi<unknown> & StoreWithProxy<typeof initialObject>;
  delete (api as Api).setState;
  (api as Api).getProxyState = () => proxyState;
  subscribe(proxyState, updateState, true);
  api.subscribe(() => {
    if (!updating) {
      // HACK for persist hydration
      const state = get();
      applyChanges(
        proxyState,
        snapshot(proxyState) as typeof proxyState,
        state as typeof proxyState,
      );
    }
  });
  return snapshot(proxyState) as Snapshot<typeof proxyState>;
};

export const withProxy = withProxyImpl as unknown as WithProxy;
