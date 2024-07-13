import { create } from 'zustand';
import { withProxy } from 'zustand-valtio';

const useCounterState = create(withProxy({ count: 0 }));

const Counter = () => {
  const count = useCounterState((state) => state.count);
  const inc = () => ++useCounterState.getProxyState().count;
  return (
    <>
      <div>Count: {count}</div>
      <button type="button" onClick={inc}>
        +1
      </button>
    </>
  );
};

const App = () => (
  <div>
    <Counter />
  </div>
);

export default App;
