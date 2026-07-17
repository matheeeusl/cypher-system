import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    exclude: ['dist/**', 'node_modules/**'],
    // Without this, Vite's SSR module graph can load `graphql` twice under
    // different resolution paths (once for graphql-yoga's internals, once
    // for a direct `import ... from 'graphql'`), and graphql's schema/type
    // instanceof checks then fail across the two copies even though only
    // one version is installed. Forcing these packages to resolve as plain
    // Node modules (not re-processed by Vite) keeps it to one instance.
    server: {
      deps: {
        inline: [/graphql/],
      },
    },
  },
})
