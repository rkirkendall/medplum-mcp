module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts', // Matches any .test.ts file within the tests directory and its subdirectories
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/medplum/', // Explicitly ignore the medplum directory
  ],
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // A list of paths to directories that Jest should use to search for files in
  roots: [
    '<rootDir>/tests',
    '<rootDir>/src', // Also include src if you plan to put unit tests alongside source files later
  ],
}; 