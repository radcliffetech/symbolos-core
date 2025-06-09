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

The **Symbolos Core** engine is licensed under the [MIT License](./LICENSE).

This license applies to the symbolic execution substrate, including:
- Core types
- Functors
- Pipeline execution
- CLI runner

---

### 🔐 Dual Licensing Notice

**Domain-specific extensions** of Symbolos — including pipelines, cognitive agents, metaphysical simulation layers, and advanced orchestration — are **not included** in this license.

These components are protected intellectual property and may be:
- Licensed separately for research or commercial use
- Reserved for internal or future public distribution

For access or licensing inquiries, contact **Jeffrey Radcliffe** at [jeffrey.radcliffe@gmail.com](mailto:jeffrey.radcliffe@gmail.com).