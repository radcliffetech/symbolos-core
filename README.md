# [![CI](https://github.com/radcliffetch/symbolos-core/actions/workflows/ci.yml/badge.svg)](https://github.com/radcliffetch/symbolos-core/actions/workflows/ci.yml)

# 🧠 Symbolos Core

**Symbolos Core** is a meta-systems substrate, a symbolic simulation and transformation engine. It enables programmable worlds, causal pipelines, and agent-based symbolic reasoning using structured Functors and Pipelines.

This core module provides the universal symbolic substrate for higher-level applications in narrative AI, procedural metaphysics, planning, and beyond.

---

## 📁 File Structure

```
symbolos-core/
├── core/
│   ├── cli/                       # CLI entry point for running simulations
│   ├── functors/                  # Domain-agnostic reusable functors
│   ├── lib/utils/                 # File and functor application helpers
│   ├── pipelines/examples/        # Example pipelines (e.g. Conway's Game of Life)
│   ├── simulators/                # World simulator logic and test suite
│   └── types/                     # Core symbolic type definitions
├── docs/                          # Supporting documentation
├── LICENSE                        # License for Symbolos Core
├── package.json                   # Project metadata and dependencies
├── pnpm-lock.yaml                 # Lockfile for deterministic builds
├── README.md                      # You are here
└── tsconfig.json                  # TypeScript configuration
```

---

## 🛠 Features

- Composable symbolic Functors and Pipelines
- WorldInstance execution model with ticks and steps
- Provenance-aware symbolic transformations
- CLI runner for testing pipelines
- Minimal test coverage and fast simulation cycles

---

## 🚀 Getting Started

```bash
pnpm install
pnpm dev
```

Use the CLI to run or fork simulations using the `conway-game` pipeline or your own.

```bash
pnpm dev -- --pipelineId=conway-game
```

---

## 🧩 License

MIT — see [LICENSE](./LICENSE) for details.

---

## 🎯 Design Philosophy

This repository contains the **minimal core** of the Symbolos symbolic execution framework. It is designed to demonstrate the foundational symbolic structures, transformations, and pipeline execution capabilities that underpin the broader system.

It intentionally excludes:
- Domain-specific functors (e.g., musical, narrative, spatial)
- Frontend or visualization layers
- Agent-specific identity models

This module is designed to be **embeddable**, **forkable**, and **verifiable** as a symbolic substrate for any higher-order simulation or cognition system.

For a full description of the Symbolos architecture and philosophy, see [about_symbolos.md](./docs/about_symbolos.md).