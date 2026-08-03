import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const authRequiredPaths = ["/dashboard", "/checkin", "/insight", "/summary", "/community", "/onboarding"];
  const isAuthRequired = authRequiredPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isAuthRequired && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    return NextResponse.redirect(redirectUrl);
  }

  // Gate protected pages (but not /onboarding itself, to avoid a redirect loop)
  // behind onboarding completeness: a caregiver must have set patient
  // name/age before they can use the app. One lightweight query per navigation
  // is an acceptable tradeoff for correctness over a stale cached flag.
  const onboardingRequiredPaths = ["/dashboard", "/checkin", "/insight", "/summary", "/community"];
  const needsOnboardingCheck = onboardingRequiredPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (needsOnboardingCheck && user) {
    const { data: patient } = await supabase
      .from("patients")
      .select("age")
      .eq("caregiver_id", user.id)
      .maybeSingle();

    if (!patient || patient.age === null) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/onboarding";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/checkin/:path*", "/insight/:path*", "/summary/:path*", "/community/:path*", "/onboarding/:path*"],
};
