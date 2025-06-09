# 📦 CHANGELOG — Symbolos Core

All notable changes to this project will be documented in this file.

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

## [0.1.1] — 2025-06-09

🧼 Structural Improvements

- Moved all CLI code to top-level `/cli` for modularity
- Relocated functors and pipelines to `/examples` to keep `core/` minimal
- Updated `.npmignore` to exclude tests, examples, CLI, and docs from NPM package

🧠 Functional Enhancements

- Added `createSymbolicObject()` factory to standardize object creation (IDs, timestamps, types)
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
