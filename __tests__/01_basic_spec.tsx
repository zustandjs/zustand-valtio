import { createWithProxy } from '../src/index';

describe('basic spec', () => {
  it('should export functions', () => {
    expect(createWithProxy).toBeDefined();
  });
});
