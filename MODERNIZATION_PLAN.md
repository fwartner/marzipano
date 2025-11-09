# Marzipano Modernization Plan

**Date:** 2025-11-09
**Version:** 0.10.2 → 1.0.0
**Status:** In Progress

## Executive Summary

Comprehensive modernization of Marzipano from ES5/CommonJS to ES6+/ES Modules with modern build tooling and development experience improvements.

## Current State Analysis

### Codebase Statistics
- **Source Files:** 91 JavaScript files
- **Module System:** CommonJS (require/module.exports)
- **Syntax:** ES5 with 'use strict'
- **Bundler:** Browserify + Watchify
- **Test Runner:** Testem + Mocha/Chai/Sinon
- **Documentation:** JSDoc
- **Linting:** None
- **Type Safety:** None

### Dependency Analysis

**Runtime Dependencies:**
- `bowser: 1.9.4` - Browser detection (outdated, current: 2.11.0)
- `gl-matrix: 3.3.0` - 3D math library (modern, keep)
- `hammerjs: 2.0.4` - Touch gestures (outdated, unmaintained)
- `minimal-event-emitter: 1.0.0` - Event system (simple, keep)

**Dev Dependencies:**
- `browserify: ^17.0.0` - Module bundler (outdated)
- `watchify: ^3.11.1` - File watcher (outdated)
- `testem: ^3.2.0` - Test runner (outdated)
- `mocha: ^8.2.1` - Test framework (current: 10.x)
- `chai: ^4.2.0` - Assertions (current: 5.x)
- `sinon: ^9.2.2` - Test spies/stubs (current: 19.x)
- `uglify-js: ^3.12.3` - Minifier (outdated)
- `jsdoc: ^3.6.6` - Documentation (current: 4.x)

## Modernization Strategy

### Phase 1: Build Infrastructure ⚡ LOW RISK

**Goal:** Modern development experience with minimal code changes

#### 1.1 Replace Browserify with Vite
- **Why:** Faster dev server, native ES modules, better tree-shaking, HMR
- **Changes:**
  - Add Vite + vite-plugin-node-polyfills
  - Create `vite.config.js`
  - Update `scripts/dev` to use Vite
  - Keep backward-compatible build output

#### 1.2 Modernize Testing Infrastructure
- **Replace:** Testem → Vitest
- **Why:** Faster, better DX, Vite-native, Mocha-compatible API
- **Changes:**
  - Add Vitest
  - Update test configuration
  - Maintain existing test files initially
  - Add coverage reporting

#### 1.3 Add Development Tools
- **ESLint:** Modern JavaScript linting
- **Prettier:** Code formatting
- **Husky + lint-staged:** Pre-commit hooks
- **Configuration:**
  - `.eslintrc.json` - Modern ES6+ rules
  - `.prettierrc` - Consistent formatting
  - `.husky/` - Git hooks

**Deliverables:**
- `vite.config.js`
- `vitest.config.js`
- `.eslintrc.json`
- `.prettierrc`
- Updated `package.json` scripts
- Updated development documentation

**Risk:** LOW - Infrastructure changes, doesn't affect source code

---

### Phase 2: Code Modernization 🔄 MEDIUM RISK

**Goal:** Modern JavaScript syntax and module system

#### 2.1 Convert CommonJS → ES6 Modules
- **Scope:** All 91 source files + test files
- **Pattern:**
  ```javascript
  // Before
  var Module = require('./Module');
  module.exports = MyClass;

  // After
  import Module from './Module.js';
  export default MyClass;
  ```
- **Strategy:**
  - Automated conversion with codemod
  - Manual verification of edge cases
  - Update file extensions awareness (.js required in imports)

#### 2.2 Modernize JavaScript Syntax
- **ES5 → ES6+ Conversions:**
  - `var` → `const/let`
  - `function` → arrow functions (where appropriate)
  - Prototypal inheritance → ES6 classes (where appropriate)
  - String concatenation → template literals
  - Object.assign → spread operators
  - Remove 'use strict' (implicit in ES modules)

- **Example:**
  ```javascript
  // Before
  'use strict';
  var foo = 'bar';
  var result = 'Value: ' + foo;

  // After
  const foo = 'bar';
  const result = `Value: ${foo}`;
  ```

#### 2.3 Update Dependencies
- **Runtime:**
  - `bowser: 1.9.4 → 2.11.0` - API changes, needs migration
  - `hammerjs: 2.0.4` → `@use-gesture/vanilla: ^10.3.0` (or keep if too risky)
  - Keep `gl-matrix: 3.3.0`
  - Keep `minimal-event-emitter: 1.0.0`

- **Dev:**
  - `mocha: ^8.2.1 → ^10.7.0`
  - `chai: ^4.2.0 → ^5.1.0`
  - `sinon: ^9.2.2 → ^19.0.0`
  - Remove browserify, watchify, uglify-js, testem
  - Add vite, vitest, eslint, prettier

**Deliverables:**
- ES6 module versions of all source files
- Modern JavaScript syntax throughout
- Updated dependencies
- Migration guide for consumers

**Risk:** MEDIUM - Breaking changes for library consumers, needs thorough testing

---

### Phase 3: Type Safety & Documentation 📘 HIGH VALUE (OPTIONAL)

**Goal:** Better developer experience and type safety

#### 3.1 Add TypeScript Declarations
- **Approach:** JSDoc → TypeScript `.d.ts` files
- **Scope:** Public API surface
- **Tools:** TypeScript compiler with `declaration: true`
- **Benefits:**
  - IntelliSense in IDEs
  - Type checking for consumers
  - Better documentation
  - No source migration required

#### 3.2 Optional: Gradual TypeScript Migration
- **Strategy:**
  - Start with utility files
  - Migrate leaf nodes first
  - Work up to core classes
  - Mixed .js/.ts during transition

- **Timeline:** Post-v1.0.0 in separate releases

#### 3.3 Documentation Modernization
- **Replace:** JSDoc → TypeDoc
- **Why:** Better TypeScript integration, modern output
- **Keep:** Existing JSDoc comments (TypeDoc compatible)

**Deliverables:**
- `index.d.ts` - Type declarations
- `tsconfig.json` - TypeScript configuration
- TypeDoc-generated documentation
- Optional: Partial TypeScript source files

**Risk:** LOW (if only adding .d.ts) / HIGH (if migrating source)

---

## Implementation Approach

### Recommended Strategy: Incremental Modernization

**Stage 1: Foundation (Week 1)**
- Phase 1.1-1.3: Build infrastructure
- Validate dev server and tests work
- No source code changes yet

**Stage 2: Code Transformation (Week 2-3)**
- Phase 2.1: Module system conversion
- Phase 2.2: Syntax modernization
- Run full test suite continuously
- Fix issues incrementally

**Stage 3: Dependencies (Week 4)**
- Phase 2.3: Update dependencies
- Test each dependency update separately
- Rollback if breaking changes too severe

**Stage 4: Polish (Week 5)**
- Documentation updates
- CLAUDE.md updates
- Migration guide for consumers
- Prepare release notes

**Stage 5: Optional Enhancement (Post-Release)**
- Phase 3: TypeScript declarations
- Can be v1.1.0 feature

### Testing Strategy

**Continuous Validation:**
1. Run test suite after each transformation batch
2. Manual testing of demos
3. Performance benchmarking
4. Browser compatibility testing

**Regression Prevention:**
- Baseline test run before modernization
- Compare test results throughout process
- Visual diff of demo outputs
- Performance metrics comparison

### Rollback Plan

**Per-Phase Rollback:**
- Git branches for each phase
- Tag known-good states
- Ability to cherry-pick fixes

**Full Rollback:**
- Keep `master` stable
- Modernization in `modernization/main` branch
- Merge only when fully validated

---

## Breaking Changes for Consumers

### Module System (v1.0.0)

**Before (CommonJS):**
```javascript
const Marzipano = require('marzipano');
const viewer = new Marzipano.Viewer(element);
```

**After (ES Modules):**
```javascript
import Marzipano from 'marzipano';
const viewer = new Marzipano.Viewer(element);
```

**Backward Compatibility:**
- Provide dual builds (ESM + UMD)
- UMD build for CDN usage
- ESM build for bundlers

### Dependency Changes

**Bowser API Changes:**
- Update browser detection calls
- Document API migration if needed

**Hammer.js (if replaced):**
- API differences with @use-gesture
- May need wrapper for backward compatibility

---

## Success Metrics

### Developer Experience
- ✅ Dev server startup: <2s (vs current ~10s)
- ✅ Hot module reload: <500ms
- ✅ Test suite run: <30s (vs current ~2min)
- ✅ Linting: Real-time feedback in IDE

### Code Quality
- ✅ ESLint: 0 errors, 0 warnings
- ✅ Test coverage: >80% (baseline current)
- ✅ Bundle size: ≤ current size
- ✅ Runtime performance: No regression

### Maintainability
- ✅ Modern syntax throughout
- ✅ Consistent code formatting
- ✅ Type hints available (Phase 3)
- ✅ Updated dependencies

---

## Risk Assessment

### Low Risk ✅
- Build tooling updates (isolated)
- Linting/formatting setup
- Dev dependency updates
- Documentation improvements

### Medium Risk ⚠️
- Module system conversion (breaking change)
- Syntax modernization (needs testing)
- Minor version updates of dependencies

### High Risk 🚨
- Major version updates (bowser, potential hammer.js replacement)
- Runtime behavior changes
- Browser compatibility issues

---

## Timeline Estimate

**Total:** 4-5 weeks for Phases 1-2, +1 week for Phase 3

| Phase | Duration | Effort |
|-------|----------|--------|
| Phase 1.1 (Vite) | 3 days | Medium |
| Phase 1.2 (Vitest) | 2 days | Low |
| Phase 1.3 (Linting) | 1 day | Low |
| Phase 2.1 (Modules) | 5 days | High |
| Phase 2.2 (Syntax) | 7 days | High |
| Phase 2.3 (Dependencies) | 3 days | Medium |
| Testing & Validation | 3 days | Medium |
| Documentation | 2 days | Low |
| **Total Phase 1-2** | **~4 weeks** | |
| Phase 3 (Optional) | 5 days | Medium |

---

## Decision: Recommended Approach

**Proceed with Phases 1-2, defer Phase 3**

**Rationale:**
- Maximum modernization benefit
- Manageable risk level
- Clear migration path for consumers
- Foundation for future TypeScript migration
- Significant DX improvements

**Release as v1.0.0:**
- Semantic versioning (breaking changes)
- Clear migration guide
- Dual build (ESM + UMD) for compatibility
- Comprehensive changelog

---

## Next Steps

1. ✅ Save this plan
2. ⏳ Implement Phase 1.1: Vite setup
3. ⏳ Implement Phase 1.2: Vitest setup
4. ⏳ Implement Phase 1.3: Linting tools
5. ⏳ Validate Phase 1 works completely
6. ⏳ Begin Phase 2 transformations
7. ⏳ Continuous testing and validation
8. ⏳ Prepare v1.0.0 release

---

## Notes

- Keep demos working throughout process
- Document all breaking changes
- Provide codemod scripts for consumers if possible
- Consider LTS support for v0.10.x
- Plan deprecation timeline for CommonJS build
