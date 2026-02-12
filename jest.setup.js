import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    const firstArg = args[0];
    const errorMessage =
      typeof firstArg === 'string'
        ? firstArg
        : firstArg?.message || firstArg?.toString() || '';

    if (
      errorMessage.includes('Not implemented: navigation') ||
      errorMessage.includes('Error: Not implemented') ||
      (firstArg?.type === 'not implemented' &&
        errorMessage.includes('navigation'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
