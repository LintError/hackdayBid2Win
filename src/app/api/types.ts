/**
 * Route parameter types for Next.js 15 App Router
 * In Next.js 15, route params are async and need to be awaited
 */

export interface RouteParams<Params extends Record<string, string> = Record<string, string>> {
  params: Promise<Params>;
}

export interface RouteParamsSingleId {
  params: Promise<{ id: string }>;
}

export interface RouteParamsDoubleId {
  params: Promise<{ id: string; roundId: string }>;
}

export interface RouteParamsTripleId {
  params: Promise<{ id: string; roundId: string; challengeId: string }>;
}

/**
 * Helper to extract params from route context
 */
export async function getParams<Params extends Record<string, string>>(
  context: { params: Promise<Params> }
): Promise<Params> {
  return await context.params;
}