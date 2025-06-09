import type { Functor, Transformation } from '@core/types';

export async function applyFunctor<Input, Output>(
  functor: Functor<Input, Output>,
  input: Input,
  inputId: string,
  context: Record<string, any> = {}
): Promise<{
  output: Output;
  transformation: Transformation;
}> {
  const output = await functor.apply(input, context);
  if (!output) {
    throw new Error(`Functor ${functor.method} did not return a valid output.`);
  }
  // check to see of this is a list of outputs or a single output

  const provenance = functor.describeProvenance(input, output);

  const outputId = (output as any).id ?? 'unknown-output';
  const id = `tx-${crypto.randomUUID()}`;
  const entry: Transformation = {
    id,
    type: 'Transformation',
    label: functor.name || functor.method,
    inputType: functor.inputType,
    outputType: functor.outputType,
    inputId,
    outputId,
    method: functor.method,
    metadata: provenance,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'complete',
    rootId: 'transformation-root', // all transformations share the same root
  };

  return {
    output,
    transformation: entry,
  };
}
