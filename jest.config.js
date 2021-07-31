module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jest',
  moduleDirectories: ['node_modules', 'src'],
  moduleNameMapper: {
    'src/(.*)': '<rootDir>/src/$1'
  },
};
