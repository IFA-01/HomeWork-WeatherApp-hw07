/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Тесты приложения погоды', () => {
  let fetchWeather, fetchGeo;

  global.fetch = jest.fn();
  global.alert = jest.fn();

  beforeEach(() => {
    jest.resetModules();

    const html = fs.readFileSync(
      path.resolve(__dirname, './index.html'),
      'utf8'
    );
    document.body.innerHTML = html;

    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn(),
      },
      configurable: true,
      writable: true,
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    jest.clearAllMocks();

    const modelModule = require('./model.js');
    fetchWeather = modelModule.fetchWeather;
    fetchGeo = modelModule.fetchGeo;

    const { init } = require('./controller.js');
    init();
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('1. Тест функции fetchWeather', () => {
    test('1.1 Успешный запрос погоды для существующего города', async () => {
      const mockWeatherData = {
        main: {
          temp: 15,
          humidity: 65,
          feels_like: 14,
        },
        weather: [{ description: 'Cloudy' }],
        wind: { speed: 5 },
        name: 'Moscow',
      };

      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
      });

      const result = await fetchWeather('Moscow');

      expect(result).toHaveProperty('main');
      expect(result.main).toHaveProperty('temp', 15);
      expect(result.main).toHaveProperty('humidity', 65);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Moscow')
      );
    });

    test('1.2 Обработка ошибки при несуществующем городе', async () => {
      global.fetch.mockResolvedValueOnce({
        text: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ cod: '404', message: 'city not found' })
          ),
      });

      const result = await fetchWeather('InvalidCity');
      expect(result).toHaveProperty('cod', '404');
    });

    test('1.3 Обработка сетевой ошибки', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(fetchWeather('Moscow')).rejects.toThrow('Network error');
    });
  });

  describe('2. Тест функции fetchGeo', () => {
    test('2.1 Успешное получение геолокации и города', async () => {
      const mockPosition = {
        coords: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
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
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'geoPermission',
        'granted'
      );
    });

    test('2.2 Обработка отказа пользователя в доступе к геолокации', async () => {
      const mockError = {
        code: 1,
        message: 'User denied the request for Geolocation.',
      };

      navigator.geolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error(mockError);
        }
      );

      await expect(fetchGeo()).rejects.toThrow(
        'User denied the request for Geolocation.'
      );
    });

    test('2.3 Браузер не поддерживает геолокацию', async () => {
      delete navigator.geolocation;

      await expect(fetchGeo()).rejects.toThrow('couldnt get geolocation');
    });
  });

  describe('3. Тест UI: кнопка "По городу"', () => {
    beforeEach(() => {
      jest.resetModules();

      const html = fs.readFileSync(
        path.resolve(__dirname, './index.html'),
        'utf8'
      );
      document.body.innerHTML = html;

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      const { init } = require('./controller.js');
      init();
    });

    test('3.1 Нажатие кнопки с пустым полем ввода', () => {
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      cityInput.value = '';
      cityBtn.click();

      expect(global.alert).toHaveBeenCalledWith('enter a city name');
    });

    test('3.2 Успешный запрос погоды по городу', async () => {
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      const mockWeatherData = {
        main: {
          temp: 15,
          humidity: 65,
        },
      };

      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
      });

      cityInput.value = 'Moscow';
      cityBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(global.fetch).toHaveBeenCalled();
    }, 10000);

    test('3.3 Запрос погоды с ошибкой', async () => {
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      global.fetch.mockRejectedValueOnce(new Error('City not found'));

      cityInput.value = 'InvalidCity';
      cityBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(global.alert).toHaveBeenCalled();
    }, 10000);
  });

  describe('4. Тест UI: кнопка "По геолокации"', () => {
    beforeEach(() => {
      jest.resetModules();

      const html = fs.readFileSync(
        path.resolve(__dirname, './index.html'),
        'utf8'
      );
      document.body.innerHTML = html;

      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn(),
        },
        configurable: true,
        writable: true,
      });

      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      const { init } = require('./controller.js');
      init();
    });

    test('4.1 Успешный сценарий получения погоды по геолокации', async () => {
      const mockPosition = {
        coords: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
      };

      navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
        success(mockPosition)
      );

      const mockCityData = [{ name: 'Moscow' }];
      const mockWeatherData = {
        main: {
          temp: 15,
          humidity: 65,
        },
      };

      global.fetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(mockCityData),
        })
        .mockResolvedValueOnce({
          text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
        });

      const geoBtn = document.getElementById('geoBtn');
      geoBtn.click();

      await new Promise((resolve) => setTimeout(resolve, 1500));

      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
      expect(global.fetch).toHaveBeenCalledTimes(2);
    }, 10000);
  });

  describe('5. Тест интеграции', () => {
    test('5.1 Сохранение geoPermission в localStorage', async () => {
      const mockPosition = {
        coords: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
      };

      navigator.geolocation.getCurrentPosition.mockImplementation((success) =>
        success(mockPosition)
      );

      const mockCityData = [{ name: 'Moscow' }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockCityData),
      });

      const { fetchGeo } = require('./model.js');
      const city = await fetchGeo();

      expect(city).toBe('Moscow');
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'geoPermission',
        'granted'
      );
    });
  });
  describe('6. Тест точки входа: index.js', () => {
    beforeEach(() => {
      jest.resetModules();
      document.body.innerHTML = '';
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true,
      });
    });

    test('6.1 Должен экспортировать init', () => {
      const index = require('./index.js');
      expect(typeof index.init).toBe('function');
    });
  });
});
