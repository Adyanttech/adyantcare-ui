import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { setDisplayZone } from '../ui';

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

try {
  if (!window.localStorage) throw new Error('localStorage is unavailable');
} catch {
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  setDisplayZone(undefined);
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.useRealTimers();
});
