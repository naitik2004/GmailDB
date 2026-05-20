import { describe, it, expect, vi } from 'vitest';
import { Hooks } from '../../src/core/hooks.js';

describe('Hooks', () => {
  it('runs beforeInsert hook', async () => {
    const hooks = new Hooks();
    const fn = vi.fn((data) => ({ ...data, modified: true }));
    hooks.register('beforeInsert', fn);

    const result = await hooks.run('beforeInsert', { name: 'Aryan' });
    expect(fn).toHaveBeenCalledOnce();
    expect(result.modified).toBe(true);
  });

  it('runs multiple hooks in order', async () => {
    const hooks = new Hooks();
    const order: number[] = [];
    hooks.register('afterInsert', () => { order.push(1); });
    hooks.register('afterInsert', () => { order.push(2); });

    await hooks.run('afterInsert', {});
    expect(order).toEqual([1, 2]);
  });

  it('clears hooks', async () => {
    const hooks = new Hooks();
    const fn = vi.fn();
    hooks.register('beforeDelete', fn);
    hooks.clear('beforeDelete');

    await hooks.run('beforeDelete', {});
    expect(fn).not.toHaveBeenCalled();
  });

  it('returns data unchanged when no hooks registered', async () => {
    const hooks = new Hooks();
    const data = { name: 'test' };
    const result = await hooks.run('beforeInsert', data);
    expect(result).toEqual(data);
  });
});