/**
 * @jest-environment jsdom
 */
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWeather } from './useWeather';

const mockFetchWeather = jest.fn();
const mockFetchGeo = jest.fn();

jest.mock('../model.js', () => ({
  fetchWeather: (...args: unknown[]) => mockFetchWeather(...args),
  fetchGeo: (...args: unknown[]) => mockFetchGeo(...args),
}));

describe('useWeather', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetchByCity with empty string sets error', async () => {
    const onSuccess = jest.fn();
    const { result } = renderHook(() => useWeather(onSuccess));
    await act(async () => {
      result.current.fetchByCity('   ');
    });
    expect(result.current.error).toContain('Введите название города');
    expect(mockFetchWeather).not.toHaveBeenCalled();
  });

  test('fetchByCity success sets weather and calls onSuccess', async () => {
    const onSuccess = jest.fn();
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 15, feels_like: 14, humidity: 80 },
      weather: [{ description: 'rain' }],
      wind: { speed: 5 },
    });
    const { result } = renderHook(() => useWeather(onSuccess));
    await act(async () => {
      result.current.fetchByCity('Moscow');
    });
    await waitFor(() => {
      expect(result.current.weather).not.toBeNull();
      expect(result.current.weather?.city).toBe('Moscow');
      expect(result.current.weather?.data.main.temp).toBe(15);
      expect(onSuccess).toHaveBeenCalledWith('Moscow');
    });
  });

  test('fetchByCity API error sets error message', async () => {
    mockFetchWeather.mockRejectedValueOnce(new Error('City not found'));
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      result.current.fetchByCity('Invalid');
    });
    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.weather).toBeNull();
    });
  });

  test('clearError and clearWeather work', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 0, feels_like: -1, humidity: 90 },
      weather: [{ description: 'snow' }],
    });
    const { result } = renderHook(() => useWeather());
    await act(async () => {
      result.current.fetchByCity('North');
    });
    await waitFor(() => expect(result.current.weather).not.toBeNull());
    act(() => {
      result.current.clearWeather();
    });
    expect(result.current.weather).toBeNull();
  });
});
