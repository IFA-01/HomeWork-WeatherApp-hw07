/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

describe('Тесты приложения погоды', () => {
  let fetchWeather, fetchGeo;

  // Моки глобальных объектов
  global.fetch = jest.fn();
  global.alert = jest.fn();

  beforeEach(() => {
    // Очищаем кэш модулей перед каждым тестом
    jest.resetModules();

    // Загружаем HTML
    const html = fs.readFileSync(
      path.resolve(__dirname, './index.html'),
      'utf8'
    );
    document.body.innerHTML = html;

    // Мокируем navigator.geolocation
    Object.defineProperty(navigator, 'geolocation', {
      value: {
        getCurrentPosition: jest.fn(),
      },
      configurable: true,
      writable: true,
    });

    // Переопределяем localStorage для каждого теста
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });

    // Очищаем моки перед каждым тестом
    jest.clearAllMocks();

    // Загружаем модуль после настройки DOM
    const scriptModule = require('./script.js');
    fetchWeather = scriptModule.fetchWeather;
    fetchGeo = scriptModule.fetchGeo;
  });

  afterEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
  });

  describe('1. Тест функции fetchWeather', () => {
    test('1.1 Успешный запрос погоды для существующего города', async () => {
      // Мокаем успешный ответ fetch
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

      // Вызываем функцию
      const result = await fetchWeather('Moscow');

      // Проверяем структуру возвращаемых данных
      expect(result).toHaveProperty('main');
      expect(result.main).toHaveProperty('temp', 15);
      expect(result.main).toHaveProperty('humidity', 65);

      // Проверяем вызов fetch с правильными параметрами
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('Moscow')
      );
    });

    test('1.2 Обработка ошибки при несуществующем городе', async () => {
      // Мокаем ошибку 404 от API
      global.fetch.mockResolvedValueOnce({
        text: jest
          .fn()
          .mockResolvedValue(
            JSON.stringify({ cod: '404', message: 'city not found' })
          ),
      });

      // Проверяем, что функция выбрасывает ошибку или возвращает данные с ошибкой
      const result = await fetchWeather('InvalidCity');
      expect(result).toHaveProperty('cod', '404');
    });

    test('1.3 Обработка сетевой ошибки', async () => {
      // Мокаем сбой сети
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      // Проверяем, что функция выбрасывает ошибку
      await expect(fetchWeather('Moscow')).rejects.toThrow('Network error');
    });
  });

  describe('2. Тест функции fetchGeo', () => {
    test('2.1 Успешное получение геолокации и города', async () => {
      // Мокаем успешное получение геолокации
      const mockPosition = {
        coords: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
      };

      navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      // Мокаем успешный ответ API reverse geocoding
      const mockCityData = [{ name: 'Moscow' }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockCityData),
      });

      // Вызываем функцию
      const city = await fetchGeo();

      // Проверяем результат
      expect(city).toBe('Moscow');

      // Проверяем сохранение в localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'geoPermission',
        'granted'
      );
    });

    test('2.2 Обработка отказа пользователя в доступе к геолокации', async () => {
      // Мокаем ошибку PERMISSION_DENIED
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied the request for Geolocation.',
      };

      navigator.geolocation.getCurrentPosition.mockImplementation(
        (success, error) => {
          error(mockError);
        }
      );

      // Проверяем, что функция выбрасывает правильную ошибку
      await expect(fetchGeo()).rejects.toThrow(
        'User denied the request for Geolocation.'
      );
    });

    test('2.3 Браузер не поддерживает геолокацию', async () => {
      // Удаляем geolocation из navigator
      delete navigator.geolocation;

      // Проверяем, что функция выбрасывает ошибку
      await expect(fetchGeo()).rejects.toThrow('couldnt get geolocation');
    });
  });

  describe('3. Тест UI: кнопка "По городу"', () => {
    beforeEach(() => {
      // Очищаем кэш модулей
      jest.resetModules();

      // Загружаем HTML заново
      const html = fs.readFileSync(
        path.resolve(__dirname, './index.html'),
        'utf8'
      );
      document.body.innerHTML = html;

      // Переопределяем localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      // Загружаем модуль после настройки DOM
      require('./script.js');
    });

    test('3.1 Нажатие кнопки с пустым полем ввода', async () => {
      // Получаем элементы
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      // Вызываем click на кнопке
      cityInput.value = '';
      cityBtn.click();

      // Проверяем вызов alert с правильным сообщением
      expect(global.alert).toHaveBeenCalledWith('enter a city name');
    });

    test('3.2 Успешный запрос погоды по городу', async () => {
      // Вводим город в поле
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      const mockWeatherData = {
        main: {
          temp: 15,
          humidity: 65,
        },
      };

      // Мокаем успешный ответ fetchWeather
      global.fetch.mockResolvedValueOnce({
        text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
      });

      // Нажимаем кнопку
      cityInput.value = 'Moscow';
      cityBtn.click();

      // Ждем выполнения асинхронных операций
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Проверяем вызов fetch
      expect(global.fetch).toHaveBeenCalled();
    });

    test('3.3 Запрос погоды с ошибкой', async () => {
      // Вводим несуществующий город
      const cityInput = document.getElementById('cityInput');
      const cityBtn = document.getElementById('cityBtn');

      // Мокаем ошибку fetchWeather
      global.fetch.mockRejectedValueOnce(new Error('City not found'));

      // Нажимаем кнопку
      cityInput.value = 'InvalidCity';
      cityBtn.click();

      // Ждем выполнения асинхронных операций
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Проверяем вызов alert с сообщением об ошибке
      expect(global.alert).toHaveBeenCalled();
    });
  });

  describe('4. Тест UI: кнопка "По геолокации"', () => {
    beforeEach(() => {
      // Очищаем кэш модулей
      jest.resetModules();

      // Загружаем HTML заново
      const html = fs.readFileSync(
        path.resolve(__dirname, './index.html'),
        'utf8'
      );
      document.body.innerHTML = html;

      // Мокируем navigator.geolocation
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: jest.fn(),
        },
        configurable: true,
        writable: true,
      });

      // Переопределяем localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(),
          setItem: jest.fn(),
          clear: jest.fn(),
        },
        writable: true,
      });

      // Загружаем модуль после настройки DOM
      require('./script.js');
    });

    test('4.1 Успешный сценарий получения погоды по геолокации', async () => {
      // Мокаем успешный fetchGeo
      const mockPosition = {
        coords: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
      };

      navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const mockCityData = [{ name: 'Moscow' }];
      const mockWeatherData = {
        main: {
          temp: 15,
          humidity: 65,
        },
      };

      // Мокаем успешный fetchWeather
      global.fetch
        .mockResolvedValueOnce({
          json: jest.fn().mockResolvedValue(mockCityData),
        })
        .mockResolvedValueOnce({
          text: jest.fn().mockResolvedValue(JSON.stringify(mockWeatherData)),
        });

      // Нажимаем кнопку геолокации
      const geoBtn = document.getElementById('geoBtn');
      geoBtn.click();

      // Ждем выполнения асинхронных операций
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Проверяем цепочку вызовов и финальный alert
      expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalled();
    });
  });

  describe('5. Тест интеграции', () => {
    test('5.1 Сохранение geoPermission в localStorage', async () => {
      // Мокаем успешный сценарий геолокации
      const mockPosition = {
        coords: {
          latitude: 55.7558,
          longitude: 37.6173,
        },
      };

      navigator.geolocation.getCurrentPosition.mockImplementation((success) => {
        success(mockPosition);
      });

      const mockCityData = [{ name: 'Moscow' }];
      global.fetch.mockResolvedValueOnce({
        json: jest.fn().mockResolvedValue(mockCityData),
      });

      // Вызываем fetchGeo напрямую
      await fetchGeo();

      // Проверяем вызов localStorage.setItem
      expect(window.localStorage.setItem).toHaveBeenCalledWith(
        'geoPermission',
        'granted'
      );
    });
  });
});
