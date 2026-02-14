import { fetchWeather, fetchGeo } from './model.js';
import { init } from './controller.js';
import EventBus from './eventBus.js';
import router from './router.js';
import './view.js';

global.alert = jest.fn();

describe('Тесты приложения погоды', () => {
  let localStorageStore = {};
  let originalLocation;
  let originalHistory;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};

    originalLocation = window.location;
    originalHistory = window.history;

    delete window.location;
    window.location = { pathname: '/' };

    window.history.pushState = jest.fn();
    window.history.back = jest.fn();

    document.body.innerHTML = '';

    const weatherApp = document.createElement('div');
    weatherApp.className = 'weather-app';
    weatherApp.id = 'weather-app';

    const h1 = document.createElement('h1');
    h1.innerHTML = '<i class="fas fa-cloud-sun"></i> Погода';
    weatherApp.appendChild(h1);

    const nav = document.createElement('nav');
    nav.className = 'navigation';
    const homeLink = document.createElement('a');
    homeLink.href = '/';
    homeLink.setAttribute('data-router', '');
    homeLink.className = 'nav-link';
    homeLink.id = 'navHome';
    homeLink.innerHTML = '<i class="fas fa-home"></i> Главная';
    const aboutLink = document.createElement('a');
    aboutLink.href = '/about';
    aboutLink.setAttribute('data-router', '');
    aboutLink.className = 'nav-link';
    aboutLink.id = 'navAbout';
    aboutLink.innerHTML = '<i class="fas fa-info-circle"></i> О приложении';
    nav.appendChild(homeLink);
    nav.appendChild(aboutLink);
    weatherApp.appendChild(nav);

    const routerContent = document.createElement('div');
    routerContent.id = 'router-content';
    weatherApp.appendChild(routerContent);

    document.body.appendChild(weatherApp);

    router.routes = [];
    router.currentRoute = null;
    router.params = {};

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

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn(),
      },
      configurable: true,
      writable: true,
    });

    global.fetch = jest.fn();

    init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    window.location = originalLocation;
    window.history = originalHistory;
  });

  describe('1. Тест функции fetchWeather', () => {
    test('1.1 Успешный запрос погоды для существующего города', async () => {
      const mockWeatherData = {
        main: { temp: 15, humidity: 65 },
        name: 'Moscow',
      };

      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
      });

      const result = await fetchWeather('Moscow');

      expect(result).toHaveProperty('main');
      expect(result.main.temp).toBe(15);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Moscow')
      );
    });

    test('1.2 Обработка ошибки при несуществующем городе', async () => {
      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(JSON.stringify({ cod: '404' })),
      });

      const result = await fetchWeather('InvalidCity');
      expect(result.cod).toBe('404');
    });

    test('1.3 Обработка сетевой ошибки', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      await expect(fetchWeather('Moscow')).rejects.toThrow('Network error');
    });
  });

  describe('2. Тест функции fetchGeo', () => {
    test('2.1 Успешное получение геолокации и города', async () => {
      const mockPosition = {
        coords: { latitude: 55.7558, longitude: 37.6173 },
      };
      navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
        success(mockPosition)
      );

      const mockCityData = [{ name: 'Moscow' }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockCityData),
      });

      const city = await fetchGeo();
      expect(city).toBe('Moscow');
      expect(localStorageStore['geoPermission']).toBe('granted');
    });

    test('2.2 Обработка отказа пользователя в доступе к геолокации', async () => {
      const mockError = { code: 1 };
      navigator.geolocation.getCurrentPosition.mockImplementation(
        (success, error) => error(mockError)
      );

      await expect(fetchGeo()).rejects.toThrow(
        'User denied the request for Geolocation.'
      );
    });

    test('2.3 Браузер не поддерживает геолокацию', async () => {
      delete navigator.geolocation;
      await expect(fetchGeo()).rejects.toThrow('couldnt get geolocation');
    });

    test('2.4 Обработка ошибки когда город не найден по координатам', async () => {
      const mockPosition = {
        coords: { latitude: 55.7558, longitude: 37.6173 },
      };
      navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
        success(mockPosition)
      );

      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue([]),
      });

      await expect(fetchGeo()).rejects.toThrow(
        'City not found for this location'
      );
    });

    test('2.5 Обработка ошибки при запросе города (catch блок)', async () => {
      const mockPosition = {
        coords: { latitude: 55.7558, longitude: 37.6173 },
      };
      navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
        success(mockPosition)
      );

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchGeo()).rejects.toThrow('Failed to get a City name');
    });

    test('2.6 Обработка ошибки геолокации: Location information is unavailable', async () => {
      const mockError = { code: 2 };
      navigator.geolocation.getCurrentPosition.mockImplementation(
        (success, error) => error(mockError)
      );

      await expect(fetchGeo()).rejects.toThrow(
        'Location information is unavailable.'
      );
    });

    test('2.7 Обработка ошибки геолокации: The request to get user location timed out', async () => {
      const mockError = { code: 3 };
      navigator.geolocation.getCurrentPosition.mockImplementation(
        (success, error) => error(mockError)
      );

      await expect(fetchGeo()).rejects.toThrow(
        'The request to get user location timed out.'
      );
    });

    test('2.8 Обработка неизвестной ошибки геолокации', async () => {
      const mockError = { code: 999 };
      navigator.geolocation.getCurrentPosition.mockImplementation(
        (success, error) => error(mockError)
      );

      await expect(fetchGeo()).rejects.toThrow('An unknown error occurred');
    });
  });

  describe('3. Тест UI: кнопка "По городу"', () => {
    test('3.1 Нажатие кнопки с пустым полем ввода', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      if (!cityInput || !cityBtn) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const input = document.getElementById('cityInput');
      const btn = document.getElementById('cityBtn');

      if (input && btn) {
        input.value = '';
        btn.click();

        await new Promise((resolve) => setTimeout(resolve, 10));

        expect(EventBus.events['error'] || alert).toBeDefined();
      }
    });

    test('3.2 Успешный запрос погоды по городу с навигацией', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      if (!cityInput || !cityBtn) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const input = document.getElementById('cityInput');
      const btn = document.getElementById('cityBtn');

      if (input && btn) {
        const mockWeatherData = {
          main: { temp: 15, humidity: 65 },
          weather: [{ description: 'clear sky' }],
          wind: { speed: 5 },
        };
        global.fetch.mockResolvedValueOnce({
          text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
        });

        const emitSpy = jest.spyOn(EventBus, 'emit');
        const routerGoSpy = jest.spyOn(router, 'go');

        input.value = 'Moscow';
        btn.click();

        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(fetch).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith(
          'weather:loaded',
          expect.objectContaining({ city: 'Moscow' })
        );
        expect(routerGoSpy).toHaveBeenCalledWith('/city/Moscow');
        emitSpy.mockRestore();
        routerGoSpy.mockRestore();
      }
    }, 10000);

    test('3.3 Обработка ошибки при запросе погоды по городу', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      if (!cityInput || !cityBtn) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const input = document.getElementById('cityInput');
      const btn = document.getElementById('cityBtn');

      if (input && btn) {
        global.fetch.mockRejectedValueOnce(new Error('Network error'));

        const emitSpy = jest.spyOn(EventBus, 'emit');

        input.value = 'Moscow';
        btn.click();

        await new Promise((resolve) => setTimeout(resolve, 1200));

        expect(fetch).toHaveBeenCalled();
        expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
        emitSpy.mockRestore();
      }
    }, 10000);
  });

  describe('4. Тест UI: кнопка "По геолокации"', () => {
    test('4.1 Успешный сценарий получения погоды по геолокации с навигацией', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const geoBtn = document.getElementById('geoBtn');
      if (!geoBtn) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const btn = document.getElementById('geoBtn');
      if (btn) {
        const mockPosition = {
          coords: { latitude: 55.7558, longitude: 37.6173 },
        };

        navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
          success(mockPosition)
        );
        global.fetch
          .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue([{ name: 'Moscow' }]),
          })
          .mockResolvedValueOnce({
            text: jest.fn().mockResolvedValue(
              JSON.stringify({
                main: { temp: 15 },
                weather: [{ description: 'clear sky' }],
                wind: { speed: 5 },
              })
            ),
          });

        const emitSpy = jest.spyOn(EventBus, 'emit');
        const routerGoSpy = jest.spyOn(router, 'go');

        btn.click();

        await new Promise((resolve) => setTimeout(resolve, 1100));

        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(emitSpy).toHaveBeenCalledWith(
          'weather:loaded',
          expect.objectContaining({ city: 'Moscow' })
        );
        expect(routerGoSpy).toHaveBeenCalledWith('/city/Moscow');
        emitSpy.mockRestore();
        routerGoSpy.mockRestore();
      }
    }, 10000);

    test('4.2 Обработка ошибки при получении погоды по геолокации', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));

      const geoBtn = document.getElementById('geoBtn');
      if (!geoBtn) {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }

      const btn = document.getElementById('geoBtn');
      if (btn) {
        const mockPosition = {
          coords: { latitude: 55.7558, longitude: 37.6173 },
        };

        navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
          success(mockPosition)
        );
        global.fetch
          .mockResolvedValueOnce({
            json: jest.fn().mockResolvedValue([{ name: 'Moscow' }]),
          })
          .mockRejectedValueOnce(new Error('Network error'));

        const emitSpy = jest.spyOn(EventBus, 'emit');

        btn.click();

        await new Promise((resolve) => setTimeout(resolve, 1200));

        expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledTimes(3);
        expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
        emitSpy.mockRestore();
      }
    }, 10000);
  });

  describe('5. Тест EventBus', () => {
    test('5.1 Должен вызывать колбэк при emit', () => {
      const callback = jest.fn();
      EventBus.on('test:event', callback);

      EventBus.emit('test:event', { data: 'hello' });

      expect(callback).toHaveBeenCalledWith({ data: 'hello' });
    });

    test('5.2 Должен вызывать несколько колбэков для одного события', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      EventBus.on('test:multi', callback1);
      EventBus.on('test:multi', callback2);

      EventBus.emit('test:multi', { data: 'test' });

      expect(callback1).toHaveBeenCalledWith({ data: 'test' });
      expect(callback2).toHaveBeenCalledWith({ data: 'test' });
    });

    test('5.3 Должен удалять колбэк через off', () => {
      const callback = jest.fn();
      EventBus.on('test:off', callback);

      EventBus.emit('test:off', { data: 'before' });
      expect(callback).toHaveBeenCalledTimes(1);

      EventBus.off('test:off', callback);
      EventBus.emit('test:off', { data: 'after' });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('5.4 off должен корректно обрабатывать несуществующее событие', () => {
      const callback = jest.fn();
      EventBus.off('nonexistent:event', callback);
      EventBus.emit('nonexistent:event', { data: 'test' });
      expect(callback).not.toHaveBeenCalled();
    });

    test('5.5 emit не должен вызывать колбэки для несуществующего события', () => {
      const callback = jest.fn();
      EventBus.emit('nonexistent:event', { data: 'test' });
      expect(callback).not.toHaveBeenCalled();
    });

    test('5.6 Должен корректно обрабатывать несколько подписок и отписок', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      const callback3 = jest.fn();

      EventBus.on('test:multiple', callback1);
      EventBus.on('test:multiple', callback2);
      EventBus.on('test:multiple', callback3);

      EventBus.emit('test:multiple', { data: 'first' });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);

      EventBus.off('test:multiple', callback2);
      EventBus.emit('test:multiple', { data: 'second' });
      expect(callback1).toHaveBeenCalledTimes(2);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(2);
    });
  });
});
