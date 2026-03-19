/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import { useSession } from './useSession';

describe('useSession', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  test('creates session when storage is empty', () => {
    const { result } = renderHook(() => useSession('/'));
    expect(result.current.sessionId).toMatch(/^session-/);
    expect(result.current.lastVisitedRoute).toBe('/');
    expect(result.current.visits).toBe(0);
  });

  test('increments visits on route changes', () => {
    const { result, rerender } = renderHook(({ path }) => useSession(path), {
      initialProps: { path: '/' },
    });
    rerender({ path: '/about' });
    rerender({ path: '/weather/London' });

    expect(result.current.lastVisitedRoute).toBe('/weather/London');
    expect(result.current.visits).toBe(2);
  });

  test('recovers from invalid session in storage', () => {
    sessionStorage.setItem('weatherAppSession', '{invalid-json');
    const { result } = renderHook(() => useSession('/about'));

    expect(result.current.sessionId).toMatch(/^session-/);
    expect(result.current.lastVisitedRoute).toBe('/about');
  });
});
