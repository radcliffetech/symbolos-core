import { describe, expect, it } from "vitest";

import { SymbolicObject } from "src/types/core";
import { World } from "./world-context";
import { createObject } from "./world-actions";

type ConwayCell = SymbolicObject & {
  position: [number, number];
  status: "alive" | "dead";
};

describe("World", () => {
  it("can add and retrieve objects by type", () => {
    const instance = World.createWorld();
    const world = new World(instance);

    const cell = createObject<ConwayCell>("ConwayCell", {
      id: "test-cell",
      position: [1, 1],
      status: "alive",
    });

    world.add(cell);

    const cells = world.getByType<typeof cell>("ConwayCell");
    expect(cells.length).toBe(1);
    expect(cells[0].id).toBe("test-cell");
  });

  it("can fork the world", () => {
    const instance = World.createWorld();
    const world = new World(instance);
    const forked = world.fork();

    expect(forked.toInstance().id).not.toBe(instance.id);
    expect(forked.toInstance().runId).not.toBe(instance.runId);
  });

  it("can advance the tick", () => {
    const instance = World.createWorld();
    const world = new World(instance);
    const startTick = world.toInstance().tick;

    world.tickForward();

    expect(world.toInstance().tick).toBe(startTick + 1);
  });

  it("can convert to a frame", () => {
    const instance = World.createWorld();
    const world = new World(instance);
    const frame = world.toFrame();

    expect(frame.tick).toBe(world.toInstance().tick);
    expect(frame.type).toBe("WorldFrame");
  });

  it("can retrieve the latest object of a type", () => {
    const instance = World.createWorld();
    const world = new World(instance);

    const cell1 = createObject<ConwayCell>("ConwayCell", {
      id: "cell-1",
      position: [0, 0],
      status: "alive",
      tick: 1,
    });
    const cell2 = createObject<ConwayCell>("ConwayCell", {
      id: "cell-2",
      position: [1, 1],
      status: "dead",
      tick: 2,
    });

    world.add([cell1, cell2]);

    const latestCell = world.getLatestOfType<ConwayCell>("ConwayCell");
    expect(latestCell?.id).toBe("cell-2");
  });
  it("can retrieve the latest object of a type when none exist", () => {
    const instance = World.createWorld();
    const world = new World(instance);

    const latestCell = world.getLatestOfType<ConwayCell>("ConwayCell");
    expect(latestCell).toBeUndefined();
  });

  it("can retrieve an object by ID", () => {
    const instance = World.createWorld();
    const world = new World(instance);

    const cell = createObject<ConwayCell>("ConwayCell", {
      id: "test-cell",
      position: [1, 1],
      status: "alive",
    });

    world.add(cell);

    const retrieved = world.getById<ConwayCell>("test-cell");
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe("test-cell");
  });

  it("getsAll returns all objects in the world", () => {
    const instance = World.createWorld();
    const world = new World(instance);

    const cell1 = createObject<ConwayCell>("ConwayCell", {
      id: "cell-1",
      position: [0, 0],
      status: "alive",
    });
    const cell2 = createObject<ConwayCell>("ConwayCell", {
      id: "cell-2",
      position: [1, 1],
      status: "dead",
    });

    world.add([cell1, cell2]);

    const allObjects = world.getAll();
    expect(allObjects.length).toBe(2);
    expect(allObjects.some((o) => o.id === "cell-1")).toBe(true);
    expect(allObjects.some((o) => o.id === "cell-2")).toBe(true);
  });

  it("adds objects with createdAt timestamp if not provided", () => {
    const instance = World.createWorld();
    const world = new World(instance);

    const cell = createObject<ConwayCell>("ConwayCell", {
      id: "test-cell",
      position: [1, 1],
      status: "alive",
    });

    world.add(cell);

    const retrieved = world.getById<ConwayCell>("test-cell");
    expect(retrieved?.createdAt).toBeDefined();
  });
});
