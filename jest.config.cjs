module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**/*.js', '!**/*.test.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?@?babel|jsdom|whatwg-url|html-encoding-sniffer|@exodus)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
