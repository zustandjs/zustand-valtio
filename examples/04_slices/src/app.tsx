import { create } from 'zustand';
import { withProxy } from 'zustand-valtio';

const countSlice = {
  value: 0,
  inc() {
    this.value++;
  },
  reset() {
    this.value = 0;
  },
};

const textSlice = {
  value: 'Hello',
  updateText(newText: string) {
    this.value = newText;
  },
  reset() {
    this.value = 'Hello';
  },
};

const useCounterState = create(
  withProxy({
    count: countSlice,
    text: textSlice,
    reset() {
      this.count.reset();
      this.text.reset();
    },
  }),
);

const Counter = () => {
  const count = useCounterState((state) => state.count.value);
  const inc = useCounterState((state) => state.count.inc);
  const text = useCounterState((state) => state.text.value);
  const updateText = useCounterState((state) => state.text.updateText);
  const reset = useCounterState((state) => state.reset);
  return (
    <>
      <p>
        Count: {count}
        <button type="button" onClick={inc}>
          +1
        </button>
      </p>
      <p>
        <input value={text} onChange={(e) => updateText(e.target.value)} />
      </p>
      <p>
        <button type="button" onClick={reset}>
          Reset
        </button>
      </p>
    </>
  );
};

const App = () => (
  <div>
    <Counter />
  </div>
);

export default App;
