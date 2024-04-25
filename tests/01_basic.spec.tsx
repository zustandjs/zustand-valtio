import { expect, test } from 'vitest';
import { createWithProxy } from 'zustand-valtio';

test('export functions', () => {
  expect(createWithProxy).toBeDefined();
});
