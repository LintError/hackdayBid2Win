import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(
              name,
              value,
              options as Parameters<typeof supabaseResponse.cookies.set>[2],
            );
          });
        },
      },
    });

    // Refresh session if expired - required for Server Components
    await supabase.auth.getUser();

    // Add CORS headers for API routes
    if (request.nextUrl.pathname.startsWith("/api/")) {
      supabaseResponse.headers.set("Access-Control-Allow-Origin", "*");
      supabaseResponse.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      supabaseResponse.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
      
      if (request.method === "OPTIONS") {
        return new NextResponse(null, { status: 200, headers: supabaseResponse.headers });
      }
    }

    return supabaseResponse;
  }

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};