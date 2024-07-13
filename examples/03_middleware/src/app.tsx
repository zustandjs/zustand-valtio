import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { withProxy } from 'zustand-valtio';

const useCounterState = create(
  persist(
    withProxy({
      count: 0,
      inc() {
        this.count++;
      },
    }),
    { name: 'counter' },
  ),
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
