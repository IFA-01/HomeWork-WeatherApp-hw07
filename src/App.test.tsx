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

  function renderApp() {
    return render(
      <div id="router-content">
        <nav className="navigation">
          <a href="/" data-router className="nav-link" id="navHome">
            Главная
          </a>
          <a href="/about" data-router className="nav-link" id="navAbout">
            О приложении
          </a>
        </nav>
        <App />
      </div>
    );
  }

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};
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
    expect(document.getElementById('cityInput')).toBeInTheDocument();
    expect(document.getElementById('cityBtn')).toBeInTheDocument();
    expect(document.getElementById('geoBtn')).toBeInTheDocument();
    expect(document.getElementById('historySection')).toBeInTheDocument();
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
    renderApp();
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
    const backSpy = jest
      .spyOn(window.history, 'back')
      .mockImplementation(() => {});
    renderApp();
    const aboutLink = document.querySelector('a[href="/about"]');
    if (aboutLink) fireEvent.click(aboutLink);
    await waitFor(() => {
      expect(document.querySelector('.about-content')).toBeInTheDocument();
    });
    const backBtn = document.querySelector('.about-content .back-btn');
    if (backBtn) fireEvent.click(backBtn);
    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  test('shows history list when history has items', () => {
    localStorageStore['weatherHistory'] = JSON.stringify(['Moscow', 'Berlin']);
    renderApp();
    expect(document.querySelector('.history-item')).toBeInTheDocument();
    expect(document.body.textContent).toContain('Moscow');
    expect(document.body.textContent).toContain('Berlin');
  });

  test('Enter key in city input submits', async () => {
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
});
