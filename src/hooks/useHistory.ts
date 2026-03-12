import React from 'react';

const STORAGE_KEY = 'weatherHistory';
const MAX_HISTORY = 10;

export function getHistory(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(city: string): string[] {
  let history = getHistory();
  history = history.filter((item) => item !== city);
  history.unshift(city);
  history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  return history;
}

export function useHistoryState(): [string[], (city: string) => void] {
  const [history, setHistory] = React.useState<string[]>(getHistory);

  const add = React.useCallback((city: string) => {
    const next = addToHistory(city);
    setHistory(next);
  }, []);

  return [history, add];
}
