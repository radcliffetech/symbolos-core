import type { SymbolicObject } from "../types";
import { v4 as uuidv4 } from "uuid";

export function createSymbolicObject<T extends SymbolicObject = SymbolicObject>(
  type: T["type"],
  data: Omit<Partial<T>, "type" | "createdAt" | "updatedAt">
): T {
  return {
    ...data,
    id:
      data.id ??
      `${type.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase()}-${uuidv4()}`,
    type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as T;
}
