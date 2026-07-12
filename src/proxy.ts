import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Matches the email hardcoded in the is_owner() Postgres function
// (supabase/migrations/0001_init.sql) — keep these in sync.
const OWNER_EMAIL = "amiranzou@outlook.com";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner = user?.email === OWNER_EMAIL;
  const isLoginPage = request.nextUrl.pathname === "/studio/login";
  const isResetPasswordPage = request.nextUrl.pathname === "/studio/reset-password";
  const isForgotPasswordPage = request.nextUrl.pathname === "/studio/forgot-password";

  if (!isOwner && !isLoginPage && !isResetPasswordPage && !isForgotPasswordPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/studio/login";
    return NextResponse.redirect(url);
  }

  if (isOwner && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/studio";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/studio/:path*"],
};
