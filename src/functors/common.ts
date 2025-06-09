import type { Functor, SymbolicLink, SymbolicObject } from "@core/types";

import { createSymbolicObject } from "../lib/object-factory";

export const LinkSymbols: Functor<
  {
    from: SymbolicObject;
    to: SymbolicObject;
    relationship: string;
    label?: string;
    description?: string;
  },
  SymbolicLink
> = {
  id: "functor-link-symbols",
  inputType: "LinkSymbolsInput",
  outputType: "SymbolicLink",
  method: "automated",
  name: "LinkSymbols",
  async apply(input) {
    const { from, to, relationship, label, description } = input;

    return createSymbolicObject<SymbolicLink>("SymbolicLink", {
      id: `link-${from.id}-${to.id}-${relationship}`,
      fromId: from.id,
      toId: to.id,
      rootId: "link-root",
      relationship,
      label: label ?? `${from.type} → ${to.type}`,
      description: description ?? `Linked by relationship: ${relationship}`,
      status: "active",
    });
  },

  describeProvenance(input) {
    return {
      fromId: input.from.id,
      toId: input.to.id,
      relationship: input.relationship,
      timestamp: new Date().toISOString(),
    };
  },
};
