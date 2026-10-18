'use strict';

/* global jest */

// Add to jest.config.js: setupFiles: ['react-native-orientation-turbo/jest/setup']
jest.mock('react-native-orientation-turbo', () =>
  require('react-native-orientation-turbo/jest/mock')
);
