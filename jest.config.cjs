/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        moduleResolution: 'node',
        module: 'CommonJS',
        esModuleInterop: true,
        strict: true,
        target: 'ES2017',
        lib: ['ES2017', 'DOM', 'DOM.Iterable'],
        skipLibCheck: true,
      },
    }],
  },
  testMatch: ['**/src/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/subs/Parser.ts',
    'src/subs/PlayerLogic.ts',
    'src/subs/Loader.ts',
    'src/subs/Logger.ts',
    'src/subs/Subs.ts',
    'src/apps/PercentArrayFilter.ts',
    'src/apps/SubtitleChunkUtils.ts',
    'src/apps/PubnubMessageQueue.ts',
    'src/apps/SubtitleChunkPlayer.ts',
  ],
};
