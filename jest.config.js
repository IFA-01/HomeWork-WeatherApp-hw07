module.exports = {
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['src/**/*.js', '!**/*.test.js', '!**/node_modules/**'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  moduleNameMapper: {
    '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(jest-)?@?babel)'],
};
