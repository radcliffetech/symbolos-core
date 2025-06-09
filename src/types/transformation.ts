export type BaseFunctor<Input, Output> = {
  id: string; // Unique identifier for the functor
  inputType: string; // Type of expected input
  outputType: string; // Type of produced output
  name: string; // Human-readable name
  method: string; // Description of method used (e.g. "LLM: gpt-4")
  description?: string; // Optional description for display
  group?: string; // Optional group label
  params?: string[]; // Optional list of parameter names
  meta?: Record<string, any>; // Arbitrary metadata
};

/** A reusable transformation function that maps input to symbolic output */
export type Functor<Input, Output> = BaseFunctor<Input, Output> & {
  apply: (input: Input, context?: any) => Promise<Output>;
  describeProvenance: (input: Input, output: Output) => Record<string, any>;
};

/** A single named symbolic step in a pipeline */
export type FunctorStep<Input = any, Output = any> = {
  id: string;
  functor: Functor<Input, Output>;
  purpose: string; // Why this step exists (e.g., "initialize", "judge")
  description?: string; // Optional human-readable note
  role?: string; // Optional symbolic function (e.g., "composer")
  extra?: Partial<Input>; // Optional extra input
  resolveInput?: (input: any, context: Record<string, any>) => Promise<Input>;
  storeOutputAs?: string; // Key to store result in context
  tickAdvance?: boolean; // Whether to advance simulation tick
  tickType?: string; // Optional tick type classification
};
