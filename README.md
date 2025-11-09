# Marzipano

> **Note:** This project was originally created by Google. [Pixel & Process](https://github.com/Pixel-Process-UG) maintains this fork to keep the project alive and up-to-date with modern web standards.

A 360° media viewer for the modern web.

This is not an official Google product.

Check out our website at http://www.marzipano.net/,
including the [demos](http://www.marzipano.net/demos.html)
and the [documentation](http://www.marzipano.net/docs.html).

Please report bugs using the [issue tracker](https://github.com/Pixel-Process-UG/marzipano/issues). If you have any questions, head over to our [discussion forum](https://groups.google.com/forum/#!forum/marzipano).

### User guide

You can include Marzipano in your project in several ways:

* Obtain the `marzipano.js` file from the latest release at
  http://www.marzipano.net and copy them into your project.

* Install Marzipano as a dependency using the `npm` package manager:
  ```bash
  npm install marzipano
  ```

* **ES Modules (Recommended):**
  ```javascript
  import { Viewer, Scene, ImageUrlSource, RectilinearView, CubeGeometry } from 'marzipano';
  ```

* **CommonJS (Legacy):**
  ```javascript
  const { Viewer, Scene, ImageUrlSource, RectilinearView, CubeGeometry } = require('marzipano');
  ```

**Note:** As of version 0.10.2+, Marzipano uses ES6 modules. See [MIGRATION.md](./MIGRATION.md) for migration guidance from older versions.

### Developer guide

This is an `npm`-based project.
A [Node.js](http://www.nodejs.org) installation is required for development.

Some dependencies expect the Node.js interpreter to be called `node`. However,
on Debian and Ubuntu systems, the binary installed by the `nodejs` package is
called `nodejs`. To work around this, install the `nodejs-legacy` package, or
use [nvm](https://github.com/creationix/nvm) instead.

Run `npm install` to install the dependencies. If you haven't in a while,
bring them up to date with `npm update`.

**Development:**
```bash
npm run dev          # Start Vite dev server with HMR at http://localhost:5173
npm run test:watch   # Run tests in watch mode with Vitest
npm run test:ui      # Run tests with Vitest UI
```

**Testing:**
```bash
npm test             # Run all tests with Vitest
npm run coverage     # Generate test coverage report
```

**Legacy Commands (still available):**
```bash
npm run dev:old      # Legacy dev server (Browserify)
npm run test:old     # Legacy test runner (Testem)
npm run livetest:old # Legacy live test server
```

The modern build system uses Vite for faster development and ES module support. Tests use Vitest with a Mocha-compatible API.

### Maintainer guide

**Automated CI/CD:**
This project uses GitHub Actions for continuous integration and automated releases:
- **CI Pipeline**: Automatically runs tests, linting, and builds on all pushes and PRs
- **Release Pipeline**: Automatically creates GitHub releases when you push a version tag
- **Dependency Updates**: Dependabot automatically checks for and proposes dependency updates

**Creating a Release:**

1. Ensure all tests pass locally: `npm test`
2. Update the `CHANGELOG` file with release notes
3. Bump the version number in `package.json`
4. Create a commit: `git commit -am "Release vX.Y.Z"`
5. Create and push a tag: `git tag vX.Y.Z && git push --tags`
6. GitHub Actions will automatically:
   - Run tests and build the project
   - Create a GitHub release with artifacts
   - Publish to npm (if `NPM_TOKEN` secret is configured)

**Manual Release (if needed):**
- `npm run release` - Build production bundle
- `npm run deploy` - Deploy to website
- `npm publish` - Publish to npm registry
