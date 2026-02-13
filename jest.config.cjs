module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**/*.{js,ts}', '!**/*.test.{js,ts}', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/eventBus.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    './src/view.ts': {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'ES2020',
        moduleResolution: 'node',
      },
    }],
    '^.+\\.js$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?babel|jsdom|whatwg-url|html-encoding-sniffer|@exodus)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
