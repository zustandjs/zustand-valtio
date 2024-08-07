import { create } from 'zustand';
import { withProxy } from 'zustand-valtio';

const useCounterState = create(
  withProxy({
    count: 0,
    inc() {
      this.count++;
    },
  }),
);

const Counter = () => {
  const count = useCounterState((state) => state.count);
  const inc = useCounterState((state) => state.inc);
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
