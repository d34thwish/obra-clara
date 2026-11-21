# Module development

Copy `packages/modules/src/template.ts`, assign a unique ID/semver/category, declare dependencies, capabilities, routes and data contracts. Register at build time, add unit tests, preview with `enabled: true` only locally, and submit a PR. Production activation requires review and a feature flag. Modules cannot load remote JavaScript or arbitrary community code.
