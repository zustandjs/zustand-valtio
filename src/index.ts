import type { StateCreator, StoreApi, StoreMutatorIdentifier } from 'zustand';
import { proxy, snapshot, subscribe } from 'valtio/vanilla';
import type { Snapshot } from 'valtio/vanilla';

type StoreWithProxy<T> = {
  setState: never;
  getProxyState: () => T;
};

type Write<T, U> = Omit<T, keyof U> & U;

type DeepWritable<T> = T extends object
  ? {
      -readonly [K in keyof T]: DeepWritable<T[K]>;
    }
  : T;

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

const withProxyImpl: WithProxyImpl = (initialObject) => (set, _get, api) => {
  type AnyObject = Record<string, unknown>;
  const proxyState = proxy(initialObject);
  let mutating = 0;
  const updateState = () => {
    if (!mutating) {
      set(snapshot(proxyState), true);
    }
  };
  Object.keys(proxyState).forEach((key) => {
    const fn = (proxyState as AnyObject)[key];
    if (typeof fn === 'function') {
      (proxyState as AnyObject)[key] = (...args: never[]) => {
        try {
          mutating += 1;
          return fn.apply(proxyState, args);
        } finally {
          mutating -= 1;
          updateState();
        }
      };
    }
  });
  type Api = StoreApi<Snapshot<typeof initialObject>> &
    StoreWithProxy<typeof initialObject>;
  delete (api as Api).setState;
  (api as Api).getProxyState = () => proxyState;
  subscribe(proxyState, updateState, true);
  return snapshot(proxyState);
};

export const withProxy = withProxyImpl as unknown as WithProxy;
