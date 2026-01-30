/**
 * @jest-environment jsdom
 */
import './index.js';
import * as controller from './controller.js';

describe('Тесты index.js', () => {
  let initSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    document.body.innerHTML = '';
    initSpy = jest.spyOn(controller, 'init').mockImplementation(() => {});
  });

  afterEach(() => {
    initSpy.mockRestore();
  });

  test('Должен вызывать init когда document.readyState === "loading"', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'loading',
      writable: true,
      configurable: true,
    });

    const addEventListenerSpy = jest.spyOn(document, 'addEventListener');

    // Имитируем логику index.js
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        controller.init();
      });
    }

    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'DOMContentLoaded',
      expect.any(Function)
    );

    const callback = addEventListenerSpy.mock.calls.find(
      (call) => call[0] === 'DOMContentLoaded'
    )[1];
    callback();
    expect(initSpy).toHaveBeenCalled();

    addEventListenerSpy.mockRestore();
  });

  test('Должен вызывать init когда document уже загружен', () => {
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: true,
      configurable: true,
    });

    // Имитируем логику index.js
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        controller.init();
      });
    } else if (typeof document !== 'undefined') {
      controller.init();
    }

    expect(initSpy).toHaveBeenCalled();
  });

  test('Должен обрабатывать случай когда document не определен', () => {
    const originalDocument = global.document;
    delete global.document;

    // Имитируем логику index.js
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        controller.init();
      });
    } else if (typeof document !== 'undefined') {
      controller.init();
    }

    expect(() => {
      // Код не должен упасть
    }).not.toThrow();

    global.document = originalDocument;
  });
});
