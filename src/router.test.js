/**
 * @jest-environment jsdom
 */
import router from './router.js';

describe('Тесты роутера', () => {
  beforeEach(() => {
    // Очищаем роутер перед каждым тестом
    router.routes = [];
    router.currentRoute = null;
    router.params = {};

    // Мокаем window.location
    delete window.location;
    window.location = {
      pathname: '/',
    };

    // Мокаем window.history
    window.history.pushState = jest.fn();
    window.history.back = jest.fn();

    // Очищаем DOM
    document.body.innerHTML = `
      <div id="router-content"></div>
      <nav>
        <a href="/" data-router class="nav-link">Главная</a>
        <a href="/about" data-router class="nav-link">О приложении</a>
      </nav>
    `;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Тест addRoute', () => {
    test('1.1 Должен добавлять маршрут', () => {
      const handler = jest.fn();
      router.addRoute('/', handler);

      expect(router.routes).toHaveLength(1);
      expect(router.routes[0].path).toBe('/');
      expect(router.routes[0].handler).toBe(handler);
    });

    test('1.2 Должен добавлять несколько маршрутов', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      router.addRoute('/', handler1);
      router.addRoute('/about', handler2);

      expect(router.routes).toHaveLength(2);
    });

    test('1.3 Должен добавлять параметризованный маршрут', () => {
      const handler = jest.fn();
      router.addRoute('/city/:cityName', handler);

      expect(router.routes).toHaveLength(1);
      expect(router.routes[0].path).toBe('/city/:cityName');
    });
  });

  describe('2. Тест matchRoute', () => {
    test('2.1 Должен совпадать корневой путь', () => {
      const result = router.matchRoute('/', '/');
      expect(result).toEqual({});
    });

    test('2.2 Должен совпадать статический путь', () => {
      const result = router.matchRoute('/about', '/about');
      expect(result).toEqual({});
    });

    test('2.3 Должен извлекать параметры из пути', () => {
      const result = router.matchRoute('/city/:cityName', '/city/Moscow');
      expect(result).toEqual({ cityName: 'Moscow' });
    });

    test('2.4 Должен декодировать URL-кодированные параметры', () => {
      const result = router.matchRoute('/city/:cityName', '/city/New%20York');
      expect(result).toEqual({ cityName: 'New York' });
    });

    test('2.5 Должен возвращать null для несовпадающих путей', () => {
      const result = router.matchRoute('/about', '/contact');
      expect(result).toBeNull();
    });

    test('2.6 Должен возвращать null для путей разной длины', () => {
      const result = router.matchRoute('/city/:cityName', '/city');
      expect(result).toBeNull();
    });

    test('2.7 Должен извлекать несколько параметров', () => {
      router.addRoute('/user/:userId/post/:postId', jest.fn());
      const result = router.matchRoute(
        '/user/:userId/post/:postId',
        '/user/123/post/456'
      );
      expect(result).toEqual({ userId: '123', postId: '456' });
    });
  });

  describe('3. Тест navigate', () => {
    test('3.1 Должен вызывать обработчик для совпадающего маршрута', () => {
      const handler = jest.fn();
      router.addRoute('/', handler);

      router.navigate('/');

      expect(handler).toHaveBeenCalled();
      expect(router.currentRoute).toBeDefined();
    });

    test('3.2 Должен передавать параметры в обработчик', () => {
      const handler = jest.fn();
      router.addRoute('/city/:cityName', handler);

      router.navigate('/city/Moscow');

      expect(handler).toHaveBeenCalledWith({ cityName: 'Moscow' });
      expect(router.params).toEqual({ cityName: 'Moscow' });
    });

    test('3.3 Должен перенаправлять на главную при несуществующем маршруте', () => {
      const homeHandler = jest.fn();
      router.addRoute('/', homeHandler);

      router.navigate('/nonexistent');

      expect(homeHandler).toHaveBeenCalled();
    });

    test('3.4 Должен принимать путь как параметр', () => {
      const handler = jest.fn();
      router.addRoute('/about', handler);

      router.navigate('/about');

      expect(handler).toHaveBeenCalled();
    });

    test('3.5 Должен обновлять активную навигацию', () => {
      const handler = jest.fn();
      router.addRoute('/about', handler);

      router.navigate('/about');

      const aboutLink = document.querySelector('a[href="/about"]');
      expect(aboutLink).toBeTruthy();
      // updateActiveNav вызывается внутри navigate с переданным путем
      // Проверяем, что класс был добавлен
      expect(aboutLink.classList.contains('active')).toBe(true);
    });
  });

  describe('4. Тест go', () => {
    test('4.1 Должен обновлять URL через pushState', () => {
      const handler = jest.fn();
      router.addRoute('/about', handler);

      router.go('/about');

      expect(window.history.pushState).toHaveBeenCalledWith({}, '', '/about');
      expect(handler).toHaveBeenCalled();
    });

    test('4.2 Должен вызывать navigate с переданным путем', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      router.go('/test');

      expect(navigateSpy).toHaveBeenCalledWith('/test');
      navigateSpy.mockRestore();
    });
  });

  describe('5. Тест init', () => {
    test('5.1 Должен добавлять обработчик popstate', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      router.init();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function)
      );
      addEventListenerSpy.mockRestore();
    });

    test('5.2 Должен добавлять обработчик кликов', () => {
      const addEventListenerSpy = jest.spyOn(document, 'addEventListener');
      router.init();

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      );
      addEventListenerSpy.mockRestore();
    });

    test('5.3 Должен вызывать navigate при инициализации', () => {
      const navigateSpy = jest.spyOn(router, 'navigate');
      router.init();

      expect(navigateSpy).toHaveBeenCalled();
      navigateSpy.mockRestore();
    });

    test('5.4 Должен обрабатывать клики по ссылкам с data-router', () => {
      const handler = jest.fn();
      router.addRoute('/about', handler);

      const link = document.querySelector('a[href="/about"]');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      router.init();
      link.dispatchEvent(clickEvent);

      expect(window.history.pushState).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
    });

    test('5.5 Должен предотвращать стандартное поведение ссылки', () => {
      const handler = jest.fn();
      router.addRoute('/about', handler);

      const link = document.querySelector('a[href="/about"]');
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });

      router.init();
      link.dispatchEvent(clickEvent);

      expect(window.history.pushState).toHaveBeenCalled();
    });

    test('5.6 Должен обрабатывать popstate события', () => {
      const handler = jest.fn();
      router.addRoute('/', handler);

      router.init();

      // Симулируем событие popstate
      window.location.pathname = '/';
      const popstateEvent = new PopStateEvent('popstate', { state: {} });
      window.dispatchEvent(popstateEvent);

      expect(handler).toHaveBeenCalled();
    });
  });

  describe('6. Тест updateActiveNav', () => {
    test('6.1 Должен добавлять класс active для текущего маршрута', () => {
      // Вызываем updateActiveNav с путем напрямую
      router.updateActiveNav('/about');

      const aboutLink = document.querySelector('a[href="/about"]');
      const homeLink = document.querySelector('a[href="/"]');

      expect(aboutLink).toBeTruthy();
      expect(homeLink).toBeTruthy();
      // Проверяем, что класс active был добавлен
      const hasActive = aboutLink.classList.contains('active');
      expect(hasActive).toBe(true);
      expect(homeLink.classList.contains('active')).toBe(false);
    });

    test('6.2 Должен удалять класс active с неактивных ссылок', () => {
      const aboutLink = document.querySelector('a[href="/about"]');
      aboutLink.classList.add('active');

      router.updateActiveNav('/');

      expect(aboutLink.classList.contains('active')).toBe(false);
    });

    test('6.3 Должен корректно обрабатывать корневой путь', () => {
      window.location.pathname = '/';
      router.updateActiveNav();

      const homeLink = document.querySelector('a[href="/"]');
      expect(homeLink.classList.contains('active')).toBe(true);
    });
  });

  describe('7. Интеграционные тесты', () => {
    test('7.1 Полный цикл навигации', () => {
      const homeHandler = jest.fn();
      const aboutHandler = jest.fn();
      const cityHandler = jest.fn();

      router.addRoute('/', homeHandler);
      router.addRoute('/about', aboutHandler);
      router.addRoute('/city/:cityName', cityHandler);

      // Навигация на главную
      window.location.pathname = '/';
      router.navigate('/');
      expect(homeHandler).toHaveBeenCalled();

      // Навигация на about
      window.location.pathname = '/about';
      router.navigate('/about');
      expect(aboutHandler).toHaveBeenCalled();

      // Навигация на город
      window.location.pathname = '/city/Moscow';
      router.navigate('/city/Moscow');
      expect(cityHandler).toHaveBeenCalledWith({ cityName: 'Moscow' });
    });

    test('7.2 Навигация с кириллическими символами', () => {
      const cityHandler = jest.fn();
      router.addRoute('/city/:cityName', cityHandler);

      const encodedCity = encodeURIComponent('Москва');
      // Используем navigate с параметром, чтобы не зависеть от location.pathname
      router.navigate(`/city/${encodedCity}`);

      expect(cityHandler).toHaveBeenCalledWith({ cityName: 'Москва' });
    });

    test('7.3 Навигация с пробелами в названии города', () => {
      const cityHandler = jest.fn();
      router.addRoute('/city/:cityName', cityHandler);

      const encodedCity = encodeURIComponent('New York');
      // Используем navigate с параметром, чтобы не зависеть от location.pathname
      router.navigate(`/city/${encodedCity}`);

      expect(cityHandler).toHaveBeenCalledWith({ cityName: 'New York' });
    });
  });
});
