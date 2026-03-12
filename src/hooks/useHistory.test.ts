/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { getHistory, addToHistory, useHistoryState } from './useHistory';

describe('useHistory', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    jest
      .spyOn(Storage.prototype, 'getItem')
      .mockImplementation((key) => store[key] ?? null);
    jest
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation((key, value) => {
        store[key] = String(value);
      });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getHistory', () => {
    it('returns empty array when no history', () => {
      expect(getHistory()).toEqual([]);
    });
    it('returns parsed history from localStorage', () => {
      store['weatherHistory'] = JSON.stringify(['Moscow', 'London']);
      expect(getHistory()).toEqual(['Moscow', 'London']);
    });
  });

  describe('addToHistory', () => {
    it('adds city to history', () => {
      const result = addToHistory('Moscow');
      expect(result).toContain('Moscow');
      expect(result[0]).toBe('Moscow');
      expect(store['weatherHistory']).toBe(JSON.stringify(['Moscow']));
    });
    it('moves existing city to front', () => {
      store['weatherHistory'] = JSON.stringify(['London', 'Paris']);
      const result = addToHistory('London');
      expect(result[0]).toBe('London');
      expect(result).toHaveLength(2);
    });
    it('limits to 10 items', () => {
      const long = Array.from({ length: 10 }, (_, i) => `City${i}`);
      store['weatherHistory'] = JSON.stringify(long);
      const result = addToHistory('New');
      expect(result).toHaveLength(10);
      expect(result[0]).toBe('New');
    });
  });

  describe('useHistoryState', () => {
    it('returns initial history and add function', () => {
      store['weatherHistory'] = JSON.stringify(['Berlin']);
      const { result } = renderHook(() => useHistoryState());
      expect(result.current[0]).toEqual(['Berlin']);
      expect(typeof result.current[1]).toBe('function');
    });
    it('add updates state', () => {
      const { result } = renderHook(() => useHistoryState());
      act(() => {
        result.current[1]('Tokyo');
      });
      expect(result.current[0]).toContain('Tokyo');
    });
  });
});
