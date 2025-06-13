/** Core metadata shared by all symbolic objects */
export interface IdentifiableObject {
  /** Unique identifier for this object */
  id: string;
  label?: string;
}

export interface BaseSymbolicObject extends IdentifiableObject {
  /** The symbolic type of this object */
  type: string;

  /** Optional description of the object */
  description?: string;

  /** ISO timestamp when this object was created */
  createdAt: string;

  /** ISO timestamp when this object was last updated */
  updatedAt?: string;

  /** ISO timestamp when this object was last validated */
  validatedAt?: string;

  /** Status string (e.g., "active", "archived", etc.) */
  status: string;

  /** ID of the root object in the ancestry tree */
  rootId?: string;

  /** Originating source system or process */
  source?: string;

  /** Request ID associated with this object's generation */
  requestId?: string;

  /** Direct parent ID (lineage tracking) */
  parentId?: string;

  /** Revision number, if versioned */
  revisionNumber?: number;

  /** ID of the original version or ancestor */
  originId?: string;

  /** Logical simulation tick, if applicable */
  tick?: number;

  /** Optional provenance metadata about how this object was generated */
  generationContext?: {
    prompt: string;
    generatorParams: object;
    model: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    notes?: string;
  };

  /** Arbitrary metadata for extension or tags */
  metadata?: Record<string, any>;
}
