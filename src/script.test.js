import { fetchWeather, fetchGeo } from './model.js';
import { init } from './controller.js';
import EventBus from './eventBus.js';
import './view.js';

global.alert = jest.fn();

describe('Тесты приложения погоды', () => {
  let localStorageStore = {};

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageStore = {};

    document.body.innerHTML = '';

    const weatherApp = document.createElement('div');
    weatherApp.className = 'weather-app';
    weatherApp.id = 'weather-app';

    const h1 = document.createElement('h1');
    h1.innerHTML = '<i class="fas fa-cloud-sun"></i> Погода';
    weatherApp.appendChild(h1);

    const inputGroup = document.createElement('div');
    inputGroup.className = 'input-group';
    const cityInput = document.createElement('input');
    cityInput.type = 'text';
    cityInput.id = 'cityInput';
    cityInput.placeholder = 'Введите город';
    inputGroup.appendChild(cityInput);
    weatherApp.appendChild(inputGroup);

    const buttons = document.createElement('div');
    buttons.className = 'buttons';
    const cityBtn = document.createElement('button');
    cityBtn.className = 'city-btn';
    cityBtn.id = 'cityBtn';
    cityBtn.innerHTML = '<i class="fas fa-city"></i> По городу';
    const geoBtn = document.createElement('button');
    geoBtn.className = 'geo-btn';
    geoBtn.id = 'geoBtn';
    geoBtn.innerHTML = '<i class="fas fa-location-arrow"></i> По геолокации';
    buttons.appendChild(cityBtn);
    buttons.appendChild(geoBtn);
    weatherApp.appendChild(buttons);

    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.id = 'loading';
    loading.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Загрузка...';
    loading.style.display = 'none';
    weatherApp.appendChild(loading);

    const error = document.createElement('div');
    error.className = 'error';
    error.id = 'error';
    error.textContent = 'Город не найден. Проверьте правильность написания.';
    weatherApp.appendChild(error);

    const weatherInfo = document.createElement('div');
    weatherInfo.className = 'weather-info';
    weatherInfo.id = 'weatherInfo';
    weatherApp.appendChild(weatherInfo);

    document.body.appendChild(weatherApp);

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
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      cityInput.value = '';
      cityBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(alert).toHaveBeenCalledWith('Введите название города');
    });

    test('3.2 Успешный запрос погоды по городу', async () => {
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      const mockWeatherData = { main: { temp: 15, humidity: 65 } };
      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
      });

      const emitSpy = jest.spyOn(EventBus, 'emit');
      cityInput.value = 'Moscow';
      cityBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(fetch).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith(
        'weather:loaded',
        expect.any(Object)
      );
      emitSpy.mockRestore();
    }, 10000);

    test('3.3 Обработка ошибки при запросе погоды по городу', async () => {
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const emitSpy = jest.spyOn(EventBus, 'emit');
      cityInput.value = 'Moscow';
      cityBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(fetch).toHaveBeenCalled();
      expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
      emitSpy.mockRestore();
    }, 10000);
  });

  describe('4. Тест UI: кнопка "По геолокации"', () => {
    test('4.1 Успешный сценарий получения погоды по геолокации', async () => {
      const geoBtn = document.getElementById('geoBtn');
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
          text: jest
            .fn()
            .mockResolvedValue(JSON.stringify({ main: { temp: 15 } })),
        });

      const emitSpy = jest.spyOn(EventBus, 'emit');
      geoBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith(
        'weather:loaded',
        expect.any(Object)
      );
      emitSpy.mockRestore();
    }, 10000);

    test('4.2 Обработка ошибки при получении погоды по геолокации', async () => {
      const geoBtn = document.getElementById('geoBtn');
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
      geoBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1100));

      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(emitSpy).toHaveBeenCalledWith('error', expect.any(Error));
      emitSpy.mockRestore();
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
