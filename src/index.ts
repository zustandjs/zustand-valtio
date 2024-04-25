import { createStore, useStore } from 'zustand';
import { proxy, snapshot, subscribe } from 'valtio/vanilla';
import type { INTERNAL_Snapshot as Snapshot } from 'valtio/vanilla';

export function createWithProxy<T extends object>(
  initialObject: T,
): {
  <Slice>(selector: (state: Snapshot<T>) => Slice): Slice;
  proxyState: T;
} {
  const proxyState = proxy(initialObject);
  Object.keys(proxyState as object).forEach((key) => {
    const fn = (proxyState as Record<string, unknown>)[key];
    if (typeof fn === 'function') {
      (proxyState as Record<string, unknown>)[key] = fn.bind(proxyState);
    }
  });
  const store = createStore(() => snapshot(proxyState));
  subscribe(proxyState, () => store.setState(snapshot(proxyState), true));
  const useProxyState = <Slice>(selector: (state: Snapshot<T>) => Slice) =>
    useStore(store, selector);
  useProxyState.proxyState = proxyState;
  return useProxyState;
}
