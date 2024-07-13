# zustand-valtio

[![CI](https://img.shields.io/github/actions/workflow/status/zustandjs/zustand-valtio/ci.yml?branch=main)](https://github.com/zustandjs/zustand-valtio/actions?query=workflow%3ACI)
[![npm](https://img.shields.io/npm/v/zustand-valtio)](https://www.npmjs.com/package/zustand-valtio)
[![size](https://img.shields.io/bundlephobia/minzip/zustand-valtio)](https://bundlephobia.com/result?p=zustand-valtio)
[![discord](https://img.shields.io/discord/627656437971288081)](https://discord.gg/MrQdmzd)

A sweet combination of Zustand and Valtio

## Install

```bash
npm install zustand zustand-valtio valtio
```

## Usage

```jsx
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
  // Or this works too
  // const inc = () => ++useCounterState.getProxyState().count;
  return (
    <>
      <div>Count: {count}</div>
      <button type="button" onClick={inc}>
        +1
      </button>
    </>
  );
};
```

## But, why?

Zustand has `immer` middleware to update state mutably.
Valtio has the same capability. Isn't the combination is sweet?

## Examples

The [examples](examples) folder contains working examples.
You can run one of them with

```bash
PORT=8080 pnpm run examples:01_counter
```

and open <http://localhost:8080> in your web browser.

You can also try them directly:
[01](https://stackblitz.com/github/zustandjs/zustand-valtio/tree/main/examples/01_counter)
[02](https://stackblitz.com/github/zustandjs/zustand-valtio/tree/main/examples/02_methods)
[03](https://stackblitz.com/github/zustandjs/zustand-valtio/tree/main/examples/03_middleware)

## Tweets

- https://twitter.com/dai_shi/status/1772063521771270343
- https://twitter.com/dai_shi/status/1772464889635684619
- https://x.com/dai_shi/status/1811982890202464399
