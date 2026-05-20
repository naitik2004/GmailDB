import { describe, it, expect } from 'vitest';

describe('Aggregate Logic', () => {
  it('groups and counts correctly', () => {
    const docs = [
      { role: 'admin' },
      { role: 'user' },
      { role: 'admin' },
      { role: 'user' },
      { role: 'guest' },
    ];

    const groups = new Map<any, number>();
    for (const doc of docs) {
      const val = doc.role;
      if (val !== undefined) {
        groups.set(val, (groups.get(val) || 0) + 1);
      }
    }

    const result = Array.from(groups.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    expect(result[0]).toEqual({ value: 'admin', count: 2 });
    expect(result[1]).toEqual({ value: 'user', count: 2 });
    expect(result[2]).toEqual({ value: 'guest', count: 1 });
  });

  it('handles empty docs', () => {
    const docs: any[] = [];
    const groups = new Map<any, number>();
    for (const doc of docs) {
      const val = doc.role;
      if (val !== undefined) groups.set(val, (groups.get(val) || 0) + 1);
    }
    const result = Array.from(groups.entries()).map(([value, count]) => ({ value, count }));
    expect(result).toHaveLength(0);
  });
});