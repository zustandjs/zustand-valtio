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
      (proxyState as AnyObject)[key] = (...args: never[]) => {
        try {
          ++mutating;
          return fn.apply(proxyState, args);
        } finally {
          --mutating;
          updateState();
        }
      };
    }
  });
  type Api = StoreApi<unknown> & StoreWithProxy<typeof initialObject>;
  delete (api as Api).setState;
  (api as Api).getProxyState = () => proxyState;
  subscribe(proxyState, updateState, true);
  api.subscribe(() => {
    if (!updating) {
      // HACK for persist hydration
      const state = get() as AnyObject;
      Object.keys(state).forEach((key) => {
        const val = state[key];
        // TODO this doesn't handle nested objects
        if (typeof val !== 'function') {
          // XXX this will throw if val is a snapshot
          (proxyState as AnyObject)[key] = val;
        }
      });
    }
  });
  return snapshot(proxyState) as Snapshot<typeof proxyState>;
};

export const withProxy = withProxyImpl as unknown as WithProxy;
