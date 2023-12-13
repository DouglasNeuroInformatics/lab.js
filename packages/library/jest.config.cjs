// @ts-check

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
}

// /** @type {import('ts-jest').JestConfigWithTsJest} */
// module.exports = {
//   roots: ['<rootDir>/src'],
//   testEnvironment: '<rootDir>/jest.environment.cjs',
//   testMatch: [
//     '**/__tests__/**/*.+(ts|tsx|js)',
//     '**/?(*.)+(spec|test).+(ts|tsx|js)',
//   ],
//   testEnvironmentOptions: {
//     url: 'https://localhost',
//   },
//   transform: {
//     '^.+\\.(ts|tsx|js)$': 'ts-jest',
//   },
// }
