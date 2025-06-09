import { describe, expect, it } from "vitest";

import { LinkSymbols } from "./common";
import { createSymbolicObject } from "../lib/object-factory";

describe("LinkSymbols", () => {
  it("creates a symbolic link between two objects", async () => {
    const result = await LinkSymbols.apply({
      from: createSymbolicObject("Agent", { id: "obj-A", label: "Agent A" }),
      to: createSymbolicObject("Structure", {
        id: "obj-B",
        label: "Structure B",
      }),
      relationship: "observes",
    });

    expect(result).toMatchObject({
      type: "SymbolicLink",
      fromId: "obj-A",
      toId: "obj-B",
      relationship: "observes",
      label: "Agent → Structure",
      description: "Linked by relationship: observes",
      status: "active",
    });

    expect(result.id).toBe("link-obj-A-obj-B-observes");
    expect(result.createdAt).toBeDefined();
  });
});
