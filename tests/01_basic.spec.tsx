import { expect, test } from 'vitest';
import { withProxy } from 'zustand-valtio';

test('export functions', () => {
  expect(withProxy).toBeDefined();
});
