import { NextRequest, NextResponse } from 'next/server'
import { ZodError, ZodSchema } from 'zod'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: unknown
  code?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json<ApiResponse<typeof data>>({
    success: true,
    data,
  }, { status })
}

export function errorResponse(
  message: string,
  status = 400,
  details?: unknown,
  code?: string
) {
  return NextResponse.json<ApiResponse<null>>({
    success: false,
    error: message,
    details,
    code,
  }, { status })
}

export async function validateBody<T>(
  request: NextRequest,
  schema: any
): Promise<{ data: T } | NextResponse> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation failed',
        details: error.flatten().fieldErrors,
      }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }
}

export function validateQuery<T>(
  request: NextRequest,
  schema: any
): { data: T } | NextResponse {
  try {
    const url = new URL(request.url)
    const query: Record<string, string | string[]> = {}
    url.searchParams.forEach((value, key) => {
      if (query[key] === undefined) {
        query[key] = value
      } else if (typeof query[key] === 'string') {
        query[key] = [query[key], value]
      } else {
        query[key].push(value)
      }
    })

    const parsedQuery: Record<string, string | string[]> = {}
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined) return
      parsedQuery[key] = value
    })

    const data = schema.parse(parsedQuery)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { success: false, error: 'Invalid query parameters' },
      { status: 400 }
    )
  }
}

export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
) {
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
  })
}

export function getAuthToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7)
}

export function apiError(message: string, status = 400, code?: string, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
      ...(details !== undefined ? { details } : {}),
    },
    { status }
  )
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

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
} as const