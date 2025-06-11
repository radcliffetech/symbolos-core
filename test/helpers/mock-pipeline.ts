import {
  createSymbolicObject,
  PipelineArgs,
  runGen2WorldSimulation,
  type Functor,
} from "@radcliffetech/symbolos-core";

const mockFunctor: Functor<any, any> = {
  id: "mock-functor",
  inputType: "InputType",
  outputType: "OutputType",
  method: "mockMethod",
  name: "MockFunctor",
  description: "A mock functor for testing",
  apply: async () => createSymbolicObject("MockOutput", {}),
  describeProvenance: () => ({
    id: "mock-provenance",
    description: "Mock provenance for testing",
  }),
};

export const mockPipelineArgs = { id: "pipeline-args", params: {} } as any;

export const mockPipelineDefinition = {
  id: "mock-pipeline",
  label: "Mock Pipeline",
  description: "A mock pipeline for testing",
  args: {
    required: [],
  },
  getSteps: (args: PipelineArgs) => [
    {
      id: "step1",
      label: "Step 1",
      purpose: "Initialize",
      functor: mockFunctor,
      tickAdvance: true,
      storeOutputAs: "output1",
    },
    {
      id: "step2",
      label: "Step 2",
      purpose: "Process",
      functor: mockFunctor,
      tickAdvance: true,
      storeOutputAs: "output2",
    },
  ],
};
