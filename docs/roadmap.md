# Symbolos Roadmap

This roadmap outlines the emerging structure of Symbolos following the Gen3 pipeline upgrade. It includes technical capabilities, symbolic expressive features, and experiential interfaces for authors and users.

---

## 🛠 Technical Routes

**1. Agent Memory**

- Agents track `Choice.id`s in `agent.memory`
- Introduce morphisms like `remember()`, `reflect()`

**2. Karma and Evaluation**

- Add `evaluation` to `Choice` objects
- Track symbolic karma in agents
- Build evaluators for alignment, truth, consequence

**3. Forking and Foresight**

- Enable `forkWorld()` + run multiple simulated choices
- Agent strategies: `simulate-first`, `act-now`, etc.

**4. Dynamic Pipelines**

- Allow agents to carry and update their own pipelines

---

## 🧬 Expressive Routes

**5. Narrative Enrichment**

- Add `scene`, `tone`, `emotion`, or `quote` to `Choice`
- Convert symbolic traces into narrative timelines

**6. Archetypal & Mythic Modeling**

- Symbolic roles: Hero, Guide, Shadow, Trickster
- Build pipelines around mythic patterns (e.g., Hero's Journey)

**7. Dialect Support**

- Encode symbolic dialects (Shaiva, Dzogchen, Stoic, etc.)
- Build functor bridges and translation between ontologies

---

## 🌐 Experiential Routes

**8. Archive Viewer**

- Web or CLI viewer for `.world.json.gz` archives
- Explore agent choices, transformations, karmic flow

**9. Authoring Toolkit**

- Visual pipeline composer
- Agent behavior scripting interface

**10. Interactive Mode**

- Step-through simulation
- Human-in-the-loop interaction
- Timeline branching by user intervention

---

## 🚀 Phased Vision

| Phase   | Focus                                                          |
| ------- | -------------------------------------------------------------- |
| `0.2.x` | Stabilize Gen3 simulator, finalize world mutation rules        |
| `0.3.x` | Add agent memory, karma scoring, summarizers                   |
| `0.4.x` | Launch viewer, support publishing and playback                 |
| `0.5.0` | Public authoring interface, remixable pipelines, world sharing |
