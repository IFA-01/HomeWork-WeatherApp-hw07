/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock model
jest.mock('./model.js', () => ({
  fetchWeather: jest.fn(),
  fetchGeo: jest.fn(),
}));

const mockFetchWeather = jest.requireMock('./model.js').fetchWeather;
const mockFetchGeo = jest.requireMock('./model.js').fetchGeo;

describe('App', () => {
  let localStorageStore: Record<string, string> = {};

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};
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
    render(
      <div id="router-content">
        <App />
      </div>
    );
    expect(document.getElementById('cityInput')).toBeInTheDocument();
    expect(document.getElementById('cityBtn')).toBeInTheDocument();
    expect(document.getElementById('geoBtn')).toBeInTheDocument();
    expect(document.getElementById('historySection')).toBeInTheDocument();
  });

  test('shows error when city button clicked with empty input', async () => {
    render(
      <div id="router-content">
        <App />
      </div>
    );
    const btn = document.getElementById('cityBtn');
    if (btn) fireEvent.click(btn);
    await waitFor(() => {
      const err = document.getElementById('error');
      expect(err && err.textContent).toContain('Введите название города');
    });
  });

  test('shows weather after successful city fetch', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 20, feels_like: 18, humidity: 60 },
      weather: [{ description: 'clear sky' }],
      wind: { speed: 3 },
    });
    render(
      <div id="router-content">
        <App />
      </div>
    );
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
      },
      { timeout: 3000 }
    );
  });

  test('back button clears weather', async () => {
    mockFetchWeather.mockResolvedValueOnce({
      main: { temp: 10, feels_like: 8, humidity: 70 },
      weather: [{ description: 'cloudy' }],
      wind: { speed: 1 },
    });
    render(
      <div id="router-content">
        <App />
      </div>
    );
    const input = document.getElementById('cityInput');
    const cityBtn = document.getElementById('cityBtn');
    if (input && cityBtn) {
      fireEvent.change(input, { target: { value: 'Paris' } });
      fireEvent.click(cityBtn);
    }
    await waitFor(
      () => expect(document.getElementById('backBtn')).toBeInTheDocument(),
      { timeout: 3000 }
    );
    const backBtn = document.getElementById('backBtn');
    if (backBtn) fireEvent.click(backBtn);
    await waitFor(() => {
      expect(document.getElementById('temperature')).not.toBeInTheDocument();
    });
  });
});
