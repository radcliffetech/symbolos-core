import type { BaseSymbolicObject } from "./base";

/** General symbolic object (alias for base interface) */
export type SymbolicObject = BaseSymbolicObject;

/** A grouped collection of symbolic objects with a shared meaning or context */
export type Constellation<T extends SymbolicObject = SymbolicObject> =
  BaseSymbolicObject & {
    type: "Constellation";
    /** The contained symbolic objects */
    objects: T[];
    /** Optional timestamp when this constellation was generated */
    generatedFrom?: {
      timestamp: string;
    };
    /** Optional tick this constellation is associated with */
    tick?: number;
  };

/** Describes a transformation from one symbolic object to another */
export type Transformation = BaseSymbolicObject & {
  type: "Transformation";
  /** ID of the input object */
  inputId: string;
  /** Symbolic type of the input */
  inputType: string;
  /** ID of the output object */
  outputId: string;
  /** Symbolic type of the output */
  outputType: string;
  /** Method or technique used for transformation */
  method: string;
  /** Arbitrary transformation metadata */
  metadata?: Record<string, any>;
  /** Status of the transformation */
  status: "pending" | "complete" | "error";
  /** Optional notes about the transformation */
  notes?: string;
};

/** A symbolic act performed by an agent using a transformation in a context */
export type SymbolicAction = BaseSymbolicObject & {
  type: "SymbolicAction";
  /** ID of the acting agent */
  actorId: string;
  /** ID of the transformation applied */
  transformationId: string;
  /** ID of the instrument or tool used */
  instrumentId?: string;
  /** ID of the input object */
  inputId: string;
  /** ID of the output object */
  outputId: string;
  /** ID of the context in which the action occurs */
  contextId: string;
  /** Purpose or intent of the action */
  purpose?: string;
  /** ISO timestamp when the action occurred */
  timestamp: string;
  /** Optional notes about the action */
  notes?: string;
};

export type WorldArchive = BaseSymbolicObject & {
  type: "WorldArchive";
  name: string; // e.g. "World Archive - 2023-10-01"
  label: string; // e.g. "World Archive - 2023-10-01"

  memberIds: string[]; // IDs of all included SymbolicObjects
  metadata?: Record<string, any>;
  members: BaseSymbolicObject[]; // All included objects, for easy retrieval
  filePath?: string; // Path to the .world.json.gz archive
};
