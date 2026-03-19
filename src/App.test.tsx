/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import App from './App';

// Mock model
jest.mock('./model.js', () => ({
  fetchWeather: jest.fn(),
  fetchWeatherByCoords: jest.fn(),
  fetchGeo: jest.fn(),
}));

const mockFetchWeather = jest.requireMock('./model.js').fetchWeather;
const mockFetchWeatherByCoords =
  jest.requireMock('./model.js').fetchWeatherByCoords;
const mockFetchGeo = jest.requireMock('./model.js').fetchGeo;

describe('App', () => {
  let localStorageStore: Record<string, string> = {};

  function renderApp() {
    return render(<App />);
  }

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};
    sessionStorage.clear();
    window.history.replaceState({}, '', '/');
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: (key: string) => localStorageStore[key] ?? null,
        setItem: (key: string, value: string) => {
          localStorageStore[key] = value;
        },
        clear: () => {
          localStorageStore = {};
        },
        removeItem: (key: string) => {
          delete localStorageStore[key];
        },
      },
      writable: true,
    });
  });

  test('renders main screen with input and buttons', () => {
    renderApp();
    expect(document.getElementById('navHome')).toBeInTheDocument();
    expect(document.getElementById('navAbout')).toBeInTheDocument();
    expect(document.getElementById('navHistory')).toBeInTheDocument();
    expect(document.getElementById('cityInput')).toBeInTheDocument();
    expect(document.getElementById('cityBtn')).toBeInTheDocument();
    expect(document.getElementById('geoBtn')).toBeInTheDocument();
    expect(document.querySelector('.city-map-selector')).toBeInTheDocument();
  });

  test('shows error when city button clicked with empty input', async () => {
    renderApp();
    const btn = document.getElementById('cityBtn');
    if (btn) fireEvent.click(btn);
    await waitFor(() => {
      const err = document.getElementById('error');
      expect(err && err.textContent).toContain('Введите название города');
    });
  });

  test('shows weather after successful city fetch', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      coord: { lat: 51.5, lon: -0.12 },
      main: { temp: 20, feels_like: 18, humidity: 60 },
      weather: [{ description: 'clear sky' }],
      wind: { speed: 3 },
    });
    renderApp();
    const input = document.getElementById('cityInput');
    const btn = document.getElementById('cityBtn');
    if (input && btn) {
      fireEvent.change(input, { target: { value: 'London' } });
      fireEvent.click(btn);
    }
    await waitFor(
      () => {
        expect(document.getElementById('temperature')).toHaveTextContent(
          '20°C'
        );
        expect(document.getElementById('location')).toHaveTextContent('London');
        expect(window.location.pathname).toBe('/weather/London');
      },
      { timeout: 3000 }
    );
    expect(document.querySelector('.map-frame')).toBeInTheDocument();
  });

  test('direct opening of parameterized route loads weather by city', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 7, feels_like: 6, humidity: 78 },
      weather: [{ description: 'fog' }],
      wind: { speed: 2 },
    });
    window.history.replaceState({}, '', '/weather/Berlin');
    renderApp();

    await waitFor(
      () =>
        expect(document.getElementById('location')).toHaveTextContent('Berlin'),
      { timeout: 3000 }
    );
    expect(mockFetchWeather).toHaveBeenCalledWith('Berlin');
  });

  test('back button returns to home route and clears weather view', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 10, feels_like: 8, humidity: 70 },
      weather: [{ description: 'cloudy' }],
      wind: { speed: 1 },
    });
    renderApp();
    const input = document.getElementById('cityInput');
    const cityBtn = document.getElementById('cityBtn');
    if (input && cityBtn) {
      fireEvent.change(input, { target: { value: 'Paris' } });
      fireEvent.click(cityBtn);
    }
    await waitFor(() =>
      expect(document.getElementById('backBtn')).toBeInTheDocument()
    );
    const backBtn = document.getElementById('backBtn');
    if (backBtn) fireEvent.click(backBtn);
    await waitFor(() => {
      expect(document.getElementById('cityInput')).toBeInTheDocument();
      expect(window.location.pathname).toBe('/');
    });
  });

  test('shows About screen when nav link "О приложении" is clicked', async () => {
    renderApp();
    const aboutLink = document.querySelector('a[href="/about"]');
    expect(aboutLink).toBeInTheDocument();
    if (aboutLink) fireEvent.click(aboutLink);
    await waitFor(() => {
      expect(document.querySelector('.about-content h2')).toHaveTextContent(
        'О приложении'
      );
    });
  });

  test('About screen back button calls history.back', async () => {
    renderApp();
    const aboutLink = document.querySelector('a[href="/about"]');
    if (aboutLink) fireEvent.click(aboutLink);
    await waitFor(() => {
      expect(document.querySelector('.about-content')).toBeInTheDocument();
    });
    const backBtn = document.querySelector('.about-content .back-btn');
    if (backBtn) fireEvent.click(backBtn);
    await waitFor(() => {
      expect(document.getElementById('cityInput')).toBeInTheDocument();
    });
  });

  test('shows history list when history has items', () => {
    localStorageStore['weatherHistory'] = JSON.stringify(['Moscow', 'Berlin']);
    renderApp();
    const historyNav = document.querySelector('a[href="/history"]');
    if (historyNav) fireEvent.click(historyNav);
    expect(document.querySelector('.history-item')).toBeInTheDocument();
    expect(document.body.textContent).toContain('Moscow');
    expect(document.body.textContent).toContain('Berlin');
  });

  test('Enter key in city input navigates to parameterized weather route', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 5, feels_like: 4, humidity: 50 },
      weather: [{ description: 'cold' }],
      wind: { speed: 2 },
    });
    renderApp();
    const input = document.getElementById('cityInput');
    if (input) {
      fireEvent.change(input, { target: { value: 'Wien' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    }
    await waitFor(
      () =>
        expect(document.getElementById('temperature')).toHaveTextContent('5°C'),
      { timeout: 3000 }
    );
    expect(window.location.pathname).toBe('/weather/Wien');
  });

  test('error close button clears error', async () => {
    renderApp();
    const btn = document.getElementById('cityBtn');
    if (btn) fireEvent.click(btn);
    await waitFor(() => {
      expect(document.getElementById('error')).toBeInTheDocument();
    });
    const closeBtn = document.querySelector(
      '#error button[aria-label="Закрыть"]'
    );
    if (closeBtn) fireEvent.click(closeBtn);
    await waitFor(() => {
      expect(document.getElementById('error')).not.toBeInTheDocument();
    });
  });

  test('history links navigate to weather route', async () => {
    localStorageStore['weatherHistory'] = JSON.stringify(['Moscow']);
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 2, feels_like: 0, humidity: 66 },
      weather: [{ description: 'snow' }],
      wind: { speed: 6 },
    });
    renderApp();
    const historyNav = document.querySelector('a[href="/history"]');
    if (historyNav) fireEvent.click(historyNav);

    const historyLink = document.querySelector('.history-link');
    expect(historyLink).toBeInTheDocument();
    if (historyLink) fireEvent.click(historyLink);

    await waitFor(() => {
      expect(document.getElementById('location')).toHaveTextContent('Moscow');
    });
    expect(window.location.pathname).toBe('/weather/Moscow');
  });

  test('history click uses cached weather without repeated fetch', async () => {
    localStorageStore['weatherHistory'] = JSON.stringify(['Prague']);
    localStorageStore['weatherDataCache'] = JSON.stringify({
      prague: {
        main: { temp: 16, feels_like: 15, humidity: 61 },
        weather: [{ description: 'cached weather' }],
        wind: { speed: 3 },
      },
    });
    renderApp();
    const historyNav = document.querySelector('a[href="/history"]');
    if (historyNav) fireEvent.click(historyNav);

    const historyLink = document.querySelector('.history-link');
    if (historyLink) fireEvent.click(historyLink);

    await waitFor(() => {
      expect(document.getElementById('location')).toHaveTextContent('Prague');
      expect(document.getElementById('description')).toHaveTextContent(
        'cached weather'
      );
    });
    expect(mockFetchWeather).not.toHaveBeenCalled();
  });

  test('coords route loads weather by coordinates', async () => {
    mockFetchWeatherByCoords.mockResolvedValueOnce({
      name: 'Point City',
      coord: { lat: 34.5, lon: 12.4 },
      main: { temp: 11, feels_like: 9, humidity: 74 },
      weather: [{ description: 'windy' }],
      wind: { speed: 6 },
    });
    window.history.replaceState({}, '', '/weather/coords/34.5/12.4');
    renderApp();

    await waitFor(() => {
      expect(window.location.pathname).toBe('/weather/coords/34.5/12.4');
      expect(document.getElementById('location')).toHaveTextContent(
        'Point City'
      );
    });
    expect(mockFetchWeatherByCoords).toHaveBeenCalledWith(34.5, 12.4);
  });
});
