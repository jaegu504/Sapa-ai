import { describe, it, expect } from 'vitest';

describe('Sanity & Test Harness Smoke Test', () => {
  it('runs vitest properly', () => {
    expect(1 + 1).toBe(2);
  });

  it('runs inside jsdom environment', () => {
    const el = document.createElement('div');
    el.innerHTML = '<span class="text-primary">GrowSphere CRM</span>';
    document.body.appendChild(el);
    expect(document.body.textContent).toContain('GrowSphere CRM');
  });

  it('provides indexedDB via fake-indexeddb for Dexie compatibility', () => {
    expect(globalThis.indexedDB).toBeDefined();
  });
});
