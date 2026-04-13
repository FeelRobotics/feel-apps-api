import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: '$feel',
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'es2017',
})
