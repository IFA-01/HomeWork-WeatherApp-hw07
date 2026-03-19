import { useState, useCallback } from 'react';
import { fetchGeo, fetchWeather, fetchWeatherByCoords } from '../model.js';
import type { WeatherData } from '../model.js';
import type { WeatherState } from '../types/weather';

const WEATHER_CACHE_KEY = 'weatherDataCache';
const MAX_CACHE_ITEMS = 20;

type WeatherCacheRecord = Record<string, WeatherData>;

function normalizeCity(city: string): string {
  return city.trim().toLowerCase();
}

function readCache(): WeatherCacheRecord {
  try {
    const raw = localStorage.getItem(WEATHER_CACHE_KEY);
    return raw ? (JSON.parse(raw) as WeatherCacheRecord) : {};
  } catch {
    return {};
  }
}

function writeCache(cache: WeatherCacheRecord): void {
  localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(cache));
}

function getCachedWeather(city: string): WeatherData | null {
  const cache = readCache();
  const key = normalizeCity(city);
  return cache[key] ?? null;
}

function saveCachedWeather(city: string, data: WeatherData): void {
  const cache = readCache();
  const key = normalizeCity(city);
  const nextCache: WeatherCacheRecord = { ...cache, [key]: data };
  const keys = Object.keys(nextCache);
  if (keys.length > MAX_CACHE_ITEMS) {
    const keyToDelete = keys[0];
    delete nextCache[keyToDelete];
  }
  writeCache(nextCache);
}

export function useWeather(onSuccess?: (city: string) => void): {
  weather: WeatherState;
  loading: boolean;
  error: string | null;
  fetchByCity: (
    city: string,
    options?: { preferCache?: boolean }
  ) => Promise<string | null>;
  fetchByCoords: (lat: number, lon: number) => Promise<string | null>;
  fetchByGeo: () => Promise<string | null>;
  clearError: () => void;
  clearWeather: () => void;
} {
  const [weather, setWeather] = useState<WeatherState>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearWeather = useCallback(() => setWeather(null), []);

  const fetchByCity = useCallback(
    async (city: string, options?: { preferCache?: boolean }) => {
      const trimmed = city.trim();
      if (!trimmed) {
        setError('Введите название города');
        return null;
      }

      if (options?.preferCache) {
        const cachedData = getCachedWeather(trimmed);
        if (cachedData) {
          setError(null);
          setWeather({ city: trimmed, data: cachedData });
          onSuccess?.(trimmed);
          return trimmed;
        }
      }

      setError(null);
      setWeather(null);
      setLoading(true);
      try {
        const data = await fetchWeather(trimmed);
        if (data.cod && data.cod !== 200) {
          setError('Город не найден. Проверьте правильность написания.');
          return null;
        }
        saveCachedWeather(trimmed, data);
        setError(null);
        setWeather({ city: trimmed, data });
        onSuccess?.(trimmed);
        return trimmed;
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : 'Город не найден. Проверьте правильность написания.';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const fetchByCoords = useCallback(
    async (lat: number, lon: number) => {
      setError(null);
      setWeather(null);
      setLoading(true);
      try {
        const data = await fetchWeatherByCoords(lat, lon);
        if (data.cod && data.cod !== 200) {
          setError('Погода для выбранной точки не найдена.');
          return null;
        }
        const cityName =
          data.name?.trim() || `${lat.toFixed(2)}, ${lon.toFixed(2)}`;
        saveCachedWeather(cityName, data);
        setWeather({ city: cityName, data });
        onSuccess?.(cityName);
        return cityName;
      } catch (e) {
        const message =
          e instanceof Error ? e.message : 'Ошибка загрузки погоды по карте';
        setError(message);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  const fetchByGeo = useCallback(async () => {
    setError(null);
    setWeather(null);
    setLoading(true);
    try {
      const city = await fetchGeo();
      const data = await fetchWeather(city);
      if (data.cod && data.cod !== 200) {
        setError('Город не найден.');
        return null;
      }
      saveCachedWeather(city, data);
      setWeather({ city, data });
      onSuccess?.(city);
      return city;
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Ошибка получения геолокации';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return {
    weather,
    loading,
    error,
    fetchByCity,
    fetchByCoords,
    fetchByGeo,
    clearError,
    clearWeather,
  };
}
