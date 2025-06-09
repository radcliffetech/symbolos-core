# 🧠 Symbolos Core

[![npm version](https://img.shields.io/npm/v/symbolos-core.svg)](https://www.npmjs.com/package/symbolos-core)

**Symbolos Core** is a meta-systems substrate, a symbolic simulation and transformation engine. It enables programmable worlds, causal pipelines, and agent-based symbolic reasoning using structured Functors and Pipelines.

This core module provides the universal symbolic substrate for higher-level applications in narrative AI, procedural metaphysics, planning, and beyond.

---

## ❓ Why Symbolos Core?

Symbolos Core is designed for researchers, system architects, and AI builders who want a programmable foundation for simulating and transforming symbolic systems. It enables composable, introspectable worlds with structured change over time.

Common use cases include:

- Simulation of agents and symbolic environments
- Symbolic planning, memory, and world forking
- Procedural metaphysics and world generation
- Building blocks for language, art, and cognition tools

---

## 📁 File Structure

```
symbolos-core/
├── cli/                           # CLI entry point for running simulations
├── core/
│   ├── utils/                     # File and functor application helpers
│   ├── simulators/                # World simulator logic and test suite
│   └── types/                     # Core symbolic type definitions
├── docs/                          # Supporting documentation
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

### 📦 Installation

```bash
pnpm add symbolos-core
```

Or with npm:

```bash
npm install symbolos-core
```

Use `pnpm dev` to launch the CLI world simulator interactively.

### 🔍 Usage Example

```ts
import {
  PipelineArgs,
  createSymbolicObject,
  makeNewWorld,
  runWorldPipeline,
} from "@radcliffetech/symbolos-core";
import { conwayGame } from "@radcliffetech/symbolos-core/pipelines/conway-game-of-life";

const pipelineArgs = createSymbolicObject<PipelineArgs>("PipelineArgs", {
  params: {
    steps: 20,
    seedPattern: "glider",
    width: 9,
    height: 9,
  },
});

const newWorld = await runWorldPipeline({
  world: makeNewWorld("poc-conway"),
  steps: conwayGame.getSteps(pipelineArgs),
  pipelineArgs,
  config: {
    verbose: true,
    outputRoot: "./output",
    archiveDirName: "conway-archive",
    compress: true,
  },
});
console.log(`✅ Simulation completed. Final tick: ${newWorld.tick}`);
console.log(`🔢 World contains ${newWorld.artifacts.size} symbolic objects.`);
```

## ✅ Testing

```bash
pnpm test
```

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
