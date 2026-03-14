import { useState, useCallback } from 'react';
import { fetchWeather, fetchGeo } from '../model.js';
import type { WeatherState } from '../types/weather';

export function useWeather(onSuccess?: (city: string) => void): {
  weather: WeatherState;
  loading: boolean;
  error: string | null;
  fetchByCity: (city: string) => Promise<void>;
  fetchByGeo: () => Promise<void>;
  clearError: () => void;
  clearWeather: () => void;
} {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearWeather = useCallback(() => setWeather(null), []);

  const fetchByCity = useCallback(
    async (city: string) => {
      const trimmed = city.trim();
      if (!trimmed) {
        setError('Введите название города');
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const data = await fetchWeather(trimmed);
        if (data.cod && data.cod !== 200) {
          setError('Город не найден. Проверьте правильность написания.');
          return;
        }
        setWeather({ city: trimmed, data });
        onSuccess?.(trimmed);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Город не найден. Проверьте правильность написания.';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const fetchByGeo = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const city = await fetchGeo();
      const data = await fetchWeather(city);
      if (data.cod && data.cod !== 200) {
        setError('Город не найден.');
        return;
      }
      setWeather({ city, data });
      onSuccess?.(city);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Ошибка получения геолокации';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return {
    weather,
    loading,
    error,
    fetchByCity,
    fetchByGeo,
    clearError,
    clearWeather,
  };
}
