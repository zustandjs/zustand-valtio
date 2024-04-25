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
import { createWithProxy } from 'zustand-valtio';

const useCounterState = createWithProxy({
  count: 0,
  inc() {
    this.count++;
  },
});

const Counter = () => {
  const count = useCounterState((state) => state.count);
  const inc = useCounterState((state) => state.inc);
  // Or this works too
  // const inc = () => ++useCounterState.proxyState.count;
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
PORT=8080 yarn run examples:01_counter
```

and open <http://localhost:8080> in your web browser.

You can also try them in codesandbox.io:
[01](https://codesandbox.io/s/github/zustandjs/zustand-valtio/tree/main/examples/01_counter)
[02](https://codesandbox.io/s/github/zustandjs/zustand-valtio/tree/main/examples/02_methods)

## Tweets

- https://twitter.com/dai_shi/status/1772063521771270343
- https://twitter.com/dai_shi/status/1772464889635684619
