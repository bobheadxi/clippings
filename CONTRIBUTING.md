# Contributing

Ideas? Questions? Feel free to drop by the [discussions](https://github.com/bobheadxi/clippings/discussions)!

## Building the plugin

### Development builds

Development builds have manifests modified at build time to add a unique `dev` identifier and timestamped version.
When installed, it will show up as a separate plugin from [the production build](#production-builds).

Development builds use [`rollup.config.dev.js`](./rollup.config.js).

```sh
npm run dev
```

Builds are output to `dist/`.

To build directly into an Obsidian vault:

```sh
export VAULT_PATH="/Users/helloworld/its/your/vault"
npm run dev 
```

The plugin can then be loaded through the 3rd-party plugin configuration page within Obsidian.

### Production builds

Production builds use [`rollup.config.js`](./rollup.config.js).

```sh
npm run build
```

Builds are output to `dist/`.

## Developing integrations

Integrations are implemented in `src/integrations`, and they are how Clippings ingests sources and highlights.

To learn more about what Integrations are capable of and how to create new ones, see the [documentation for the `abstract class Integration`](src/integrations/integration.ts).
