# Contributing to Symbolos Core

This is a minimal symbolic engine. Please keep contributions modular and framework-agnostic.

- Functors should be reusable and domain-independent.
- Pipelines must live under `core/pipelines/examples/`.
- Test any new functor or pipeline with `vitest`.

To start:
```bash
pnpm install
pnpm dev -- --pipelineId=conway-game-of-life