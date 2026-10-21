import { NextRequest, NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

/**
 * Standardized API response helpers
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    { success: false, error: message, details },
    { status }
  );
}

/**
 * Validate request body against a Zod schema
 */
export async function validateBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    );
  }
}

/**
 * Validate query parameters against a Zod schema
 */
export function validateQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>
): { data: T } | NextResponse {
  try {
    const url = new URL(request.url);
    const query: Record<string, string | string[] | undefined> = {};
    url.searchParams.forEach((value, key) => {
      const existing = query[key];
      if (existing === undefined) {
        query[key] = value;
      } else if (typeof existing === "string") {
        // Handle multiple values
        query[key] = [existing, value];
      } else if (Array.isArray(existing)) {
        existing.push(value);
      }
    });

    // Convert arrays to comma-separated strings for Zod
    const parsedQuery: Record<string, string | string[]> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return;
      parsedQuery[key] = value;
    });

    const data = schema.parse(parsedQuery);
    return { data };
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Invalid query parameters" },
      { status: 400 }
    );
  }
}

/**
 * Error raised when a request is not authenticated (401) or the caller lacks
 * the required role (403). Route handlers translate it into the right status
 * code instead of a generic 500.
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Converts a thrown error into a standard API error response, preserving the
 * 401/403 status of authentication failures.
 */
export function handleRouteError(error: unknown, fallbackMessage: string) {
  if (error instanceof AuthError) {
    return errorResponse(error.message, error.status);
  }
  return errorResponse(
    error instanceof Error ? error.message : fallbackMessage,
    500,
  );
}

/**
 * Generate a consistent API error response
 */
export function apiError(message: string, status = 400, code?: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  );
}

/**
 * Standard pagination response
 */
export function paginatedResponse<T>(items: T[], page: number, limit: number, total: number) {
  return NextResponse.json({
    success: true,
    data: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
}

/**
 * Get the Supabase auth token from Authorization header
 */
export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Create a standard API error
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Common HTTP status codes
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;