/**
 * @jest-environment jsdom
 */
import {
  renderHome,
  renderCityWeather,
  renderAbout,
  showError,
  showLoading,
  renderHistory,
  addToHistory,
  getHistory,
} from './view.js';

describe('Тесты view.js', () => {
  let localStorageStore = {};

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    localStorageStore = {};

    document.body.innerHTML = `
      <div id="router-content"></div>
    `;

    const localStorageMock = {
      getItem: jest.fn((key) => localStorageStore[key] || null),
      setItem: jest.fn((key, value) => {
        localStorageStore[key] = value.toString();
      }),
      clear: jest.fn(() => {
        Object.keys(localStorageStore).forEach(
          (key) => delete localStorageStore[key]
        );
      }),
      removeItem: jest.fn((key) => {
        delete localStorageStore[key];
      }),
    };
    global.localStorage = localStorageMock;
    global.window.localStorage = localStorageMock;
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });

    window.history.back = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('renderHome', () => {
    test('Должен рендерить главную страницу с формой и историей', () => {
      localStorageStore['weatherHistory'] = JSON.stringify([
        'Moscow',
        'London',
      ]);

      renderHome();

      const routerContent = document.getElementById('router-content');
      expect(routerContent).toBeTruthy();
      expect(routerContent.innerHTML).toContain('cityInput');
      expect(routerContent.innerHTML).toContain('cityBtn');
      expect(routerContent.innerHTML).toContain('geoBtn');
      expect(routerContent.innerHTML).toContain('historySection');
    });

    test('Должен отображать историю при рендере главной страницы', () => {
      localStorageStore['weatherHistory'] = JSON.stringify(['Moscow']);

      renderHome();

      const historyList = document.getElementById('historyList');
      expect(historyList).toBeTruthy();
      expect(historyList.innerHTML).toContain('Moscow');
    });
  });

  describe('renderCityWeather', () => {
    test('Должен рендерить страницу погоды для города', () => {
      const mockWeather = {
        main: {
          temp: 15.5,
          humidity: 65,
          feels_like: 14.2,
        },
        weather: [{ description: 'clear sky' }],
        wind: { speed: 5.2 },
      };

      renderCityWeather('Moscow', mockWeather);

      const routerContent = document.getElementById('router-content');
      expect(routerContent).toBeTruthy();
      expect(routerContent.innerHTML).toContain('Moscow');
      expect(routerContent.innerHTML).toContain('16°C');
      expect(routerContent.innerHTML).toContain('clear sky');
      expect(routerContent.innerHTML).toContain('5.2 м/с');
      expect(routerContent.innerHTML).toContain('65%');
      expect(routerContent.innerHTML).toContain('14°C');
    });

    test('Должен обрабатывать погоду без ветра', () => {
      const mockWeather = {
        main: {
          temp: 20,
          humidity: 70,
          feels_like: 19,
        },
        weather: [{ description: 'cloudy' }],
      };

      renderCityWeather('London', mockWeather);

      const routerContent = document.getElementById('router-content');
      expect(routerContent.innerHTML).toContain('0 м/с');
    });

    test('Должен добавлять обработчик кнопки "Назад"', () => {
      const mockWeather = {
        main: { temp: 15, humidity: 65, feels_like: 14 },
        weather: [{ description: 'clear' }],
        wind: { speed: 5 },
      };

      renderCityWeather('Moscow', mockWeather);

      const backBtn = document.getElementById('backBtn');
      expect(backBtn).toBeTruthy();

      backBtn.click();
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe('renderAbout', () => {
    test('Должен рендерить страницу "О приложении"', () => {
      renderAbout();

      const routerContent = document.getElementById('router-content');
      expect(routerContent).toBeTruthy();
      expect(routerContent.innerHTML).toContain('О приложении');
      expect(routerContent.innerHTML).toContain('OpenWeatherMap');
    });

    test('Должен добавлять обработчик кнопки "Назад"', () => {
      renderAbout();

      const backBtn = document.getElementById('backBtn');
      expect(backBtn).toBeTruthy();

      backBtn.click();
      expect(window.history.back).toHaveBeenCalled();
    });
  });

  describe('showError', () => {
    test('Должен показывать ошибку в элементе error', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="error"></div>
        </div>
      `;

      showError('Тестовая ошибка');

      const errorEl = document.getElementById('error');
      expect(errorEl.textContent).toBe('Тестовая ошибка');
      expect(errorEl.style.display).toBe('block');
    });

    test('Должен скрывать ошибку через 5 секунд', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="error"></div>
        </div>
      `;

      showError('Тестовая ошибка');

      const errorEl = document.getElementById('error');
      expect(errorEl.style.display).toBe('block');

      jest.advanceTimersByTime(5000);

      expect(errorEl.style.display).toBe('none');
    });

    test('Должен использовать alert если элемент error не найден', () => {
      document.body.innerHTML = `<div id="router-content"></div>`;

      global.alert = jest.fn();
      showError('Ошибка без элемента');

      expect(alert).toHaveBeenCalledWith('Ошибка без элемента');
    });
  });

  describe('showLoading', () => {
    test('Должен показывать индикатор загрузки', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="loading"></div>
        </div>
      `;

      showLoading(true);

      const loadingEl = document.getElementById('loading');
      expect(loadingEl.style.display).toBe('block');
    });

    test('Должен скрывать индикатор загрузки', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="loading"></div>
        </div>
      `;

      showLoading(false);

      const loadingEl = document.getElementById('loading');
      expect(loadingEl.style.display).toBe('none');
    });

    test('Должен корректно обрабатывать отсутствие элемента loading', () => {
      document.body.innerHTML = `<div id="router-content"></div>`;

      expect(() => showLoading(true)).not.toThrow();
    });
  });

  describe('renderHistory', () => {
    test('Должен рендерить пустую историю', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      renderHistory([]);

      const historyList = document.getElementById('historyList');
      expect(historyList.innerHTML).toContain('История пуста');
    });

    test('Должен рендерить историю с городами', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      renderHistory(['Moscow', 'London', 'Paris']);

      const historyList = document.getElementById('historyList');
      expect(historyList.innerHTML).toContain('Moscow');
      expect(historyList.innerHTML).toContain('London');
      expect(historyList.innerHTML).toContain('Paris');
      expect(historyList.innerHTML).toContain('data-router');
    });

    test('Должен корректно обрабатывать null историю', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      renderHistory(null);

      const historyList = document.getElementById('historyList');
      expect(historyList.innerHTML).toContain('История пуста');
    });

    test('Должен возвращаться если historyList не найден', () => {
      document.body.innerHTML = `<div id="router-content"></div>`;

      expect(() => renderHistory(['Moscow'])).not.toThrow();
    });
  });

  describe('addToHistory', () => {
    test('Должен добавлять город в историю', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      addToHistory('Moscow');

      expect(localStorage.setItem).toHaveBeenCalled();
      const history = JSON.parse(localStorageStore['weatherHistory']);
      expect(history).toContain('Moscow');
      expect(history[0]).toBe('Moscow');
    });

    test('Должен перемещать существующий город в начало', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      localStorageStore['weatherHistory'] = JSON.stringify(['London', 'Paris']);

      addToHistory('London');

      const history = JSON.parse(localStorageStore['weatherHistory']);
      expect(history[0]).toBe('London');
      expect(history.length).toBe(2);
    });

    test('Должен ограничивать историю 10 элементами', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      const longHistory = Array.from({ length: 12 }, (_, i) => `City${i}`);
      localStorageStore['weatherHistory'] = JSON.stringify(longHistory);

      addToHistory('NewCity');

      const history = JSON.parse(localStorageStore['weatherHistory']);
      expect(history.length).toBe(10);
      expect(history[0]).toBe('NewCity');
    });
  });

  describe('getHistory', () => {
    test('Должен возвращать историю из localStorage', () => {
      localStorageStore['weatherHistory'] = JSON.stringify([
        'Moscow',
        'London',
      ]);

      const history = getHistory();

      expect(history).toEqual(['Moscow', 'London']);
    });

    test('Должен возвращать пустой массив если истории нет', () => {
      const history = getHistory();

      expect(history).toEqual([]);
    });
  });

  describe('EventBus обработчики', () => {
    test('Должен обрабатывать событие weather:loaded и добавлять в историю', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="historyList"></div>
        </div>
      `;

      const EventBus = require('./eventBus.js').default;
      EventBus.emit('weather:loaded', { city: 'Moscow' });

      const history = getHistory();
      expect(history).toContain('Moscow');
      expect(history[0]).toBe('Moscow');
    });

    test('Должен обрабатывать событие error с объектом', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="error"></div>
        </div>
      `;

      const EventBus = require('./eventBus.js').default;
      EventBus.emit('error', { message: 'Тестовая ошибка' });

      const errorEl = document.getElementById('error');
      expect(errorEl.textContent).toBe('Тестовая ошибка');
      expect(errorEl.style.display).toBe('block');
    });

    test('Должен обрабатывать событие error со строкой', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="error"></div>
        </div>
      `;

      const EventBus = require('./eventBus.js').default;
      EventBus.emit('error', 'Строковая ошибка');

      const errorEl = document.getElementById('error');
      expect(errorEl.textContent).toBe('Строковая ошибка');
    });

    test('Должен обрабатывать событие loading', () => {
      document.body.innerHTML = `
        <div id="router-content">
          <div id="loading"></div>
        </div>
      `;

      const EventBus = require('./eventBus.js').default;
      EventBus.emit('loading', true);

      const loadingEl = document.getElementById('loading');
      expect(loadingEl.style.display).toBe('block');

      EventBus.emit('loading', false);
      expect(loadingEl.style.display).toBe('none');
    });
  });
});
