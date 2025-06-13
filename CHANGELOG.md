# Change Log

---

## [0.3.0] — 2025-06-13

🚀 Symbolic API Refinement & Pipeline Cleanup

- Extreme slimming of core repo to < 500 lines of code (!)
- Fully adopted `World` class API for all object manipulation and querying
- Deprecated `addToWorld`, `getSymbolicWorldStore`, and `createSymbolicObject` in favor of `World.dd`, `World.store`, and `World.createObject`
- Renamed `runWorldPipeline` → `runPipeline`, with typed `PipelineResult` and `duration` timing
- Unified `PipelineRun` tracking with `recordSymbolicAction` provenance logic
- Documented all major types and helpers using JSDoc
- Added complete unit test coverage for `pipeline-helpers`
- Finalized Gen3 execution model as default runtime interface
  📦 CHANGELOG — Symbolos Core

All notable changes to this project will be documented in this file.

---

## [0.2.0] — 2025-06-11

🧠 Gen3 Pipeline Execution

- Introduced `WorldFunctor` interface for world-in/world-out transformations
- Added `runPipeline` simulator for Gen3 symbolic pipelines
- Introduced `PipelineDefinition` and `FunctorStep` types
- Clean separation between Gen2 (object) and Gen3 (world) pipeline execution

🧾 Symbolic Action Logging

- Symbolic actions now record `actorId`, `inputId`, `outputId`, and `purpose` from `outputObject`
- Added support for causal provenance using `rootId` from symbolic output
- Simulator now dynamically wraps `outputObject` and `output[]` from functors

🧪 Testing & Safety

- Added comprehensive test coverage for Gen3 pipelines, functors, and action logging
- Eliminated Gen2-style flattening in Gen3 pipeline execution
- Simulator now guards against missing `context` or `_artifactsById` bindings

🔧 CLI & Integration

- CLI now auto-selects simulator version based on `pipelineDefinition.version`
- Added CLI and simulator logging for simulator version

🧼 Type & Structure Cleanup

- Updated `Functor` return type to require `{ world, outputObject?, output? }`
- Removed obsolete `criteriaId` and Gen2 functor assumptions
- Cleaned up redundant logic around flattening and artifact promotion

---

## [0.1.2] — 2025-06-09

📁 Structural & Distribution

- Moved all core code into `src/` directory for clarity and publishability
- Updated `package.json` to point to `src/index.ts` for `main` and `types`
- Updated `tsconfig.json` includes to match new `src/` layout
- Updated `README.md` with accurate file structure

📦 NPM Interface

- Exported `conwayGame` and functors directly via top-level `index.ts`
- Simplified import paths for consumers of the package

🧪 Tests

- Preserved all test coverage under `src/`, with working CLI and archive persistence
- Tests now run against new layout with all mocks and pipeline behaviors intact

---

## [0.1.1] — 2025-06-09

🧼 Structural Improvements

- Moved all CLI code to top-level `/cli` for modularity
- Relocated functors and pipelines to `/examples` to keep `core/` minimal
- Updated `.npmignore` to exclude tests, examples, CLI, and docs from NPM package

🧠 Functional Enhancements

- Added `createObject()` factory to standardize object creation (IDs, timestamps, types)
- Refactored `storeWorldArchive`, `storeWorldFrame`, and `PipelineRun` to use the factory
- Improved ID formatting with slugified type names (e.g. `world-frame-...`)

🧪 Test Coverage

- Added tests for functors (`InitializeConwayCells`, `StepConwayCells`, `LinkSymbols`)
- Added pipeline execution test for `conwayGame`
- Added tests for `storeWorldArchive()` and `storeWorldFrame()`

🧾 Licensing & Publishing

- Clarified NPM packaging boundaries
- All tests, examples, and development files excluded from final package
- Repository and author metadata verified

🔧 Streaming & I/O Improvements

- Centralized archive path resolution logic via `resolveArchivePath()`
- `storeWorldArchive` and `storeWorldFrame` now support dynamic compression with `config.compress`
- Output files can be routed via `config.outputRoot` and `archiveDirName`
- Added optional frontend copy for final world archives

🧪 Enhanced Testing

- Mocked zlib and stream pipelines to support compressed and uncompressed cases
- Added tests for:
  - compression toggle
  - empty artifact archives
  - custom output directory names
- Validated pipeline stream structure to avoid `ENOENT` and stream signature errors

🧼 Misc

- Updated Readable and Gzip mocks to use `PassThrough` streams for full compatibility
- Cleaned up legacy pipeline writing logic

---

## [0.1.0] — 2025-06-08

✅ Initial public release of `@radcliffetech/symbolos-core`.

- Core symbolic object and transformation types
- World simulator with forkable execution
- CLI runner for pipeline simulation
- Conway Game of Life example pipeline
- MIT License with dual-licensing note
- Clean `.npmignore`, CI workflow, and test coverage

---
