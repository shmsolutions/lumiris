import { detectBot } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

// Behind Traefik, req.url carries the internal host (0.0.0.0:3000). Build the
// public origin from the forwarded headers so redirects point at the real domain.
const publicOrigin = (req: NextRequest) => {
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto') ?? 'https';
  return host ? `${proto}://${host}` : req.nextUrl.origin;
};

const isApiRoute = createRouteMatcher(['/api/(.*)']);

// Webhooks são chamadas server-to-server (Asaas) — não passam pelo Arcjet bot
// detection nem pela autenticação.
const isWebhookRoute = createRouteMatcher(['/api/billing/webhook']);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/onboarding(.*)',
  '/:locale/onboarding(.*)',
]);

const isAuthPage = createRouteMatcher([
  '/sign-in(.*)',
  '/:locale/sign-in(.*)',
  '/sign-up(.*)',
  '/:locale/sign-up(.*)',
]);

// Improve security with Arcjet
const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
  }),
);

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Canonicaliza para o apex: www.* redireciona (301 permanente) para o domínio
  // sem www — evita conteúdo duplicado e divergência de host/certificado.
  const forwardedHost = request.headers.get('x-forwarded-host') ?? request.headers.get('host');
  if (forwardedHost?.startsWith('www.')) {
    const proto = request.headers.get('x-forwarded-proto') ?? 'https';
    const apexHost = forwardedHost.slice(4);
    return NextResponse.redirect(
      `${proto}://${apexHost}${request.nextUrl.pathname}${request.nextUrl.search}`,
      308,
    );
  }

  // Webhooks externos passam direto, sem Arcjet nem Clerk.
  if (isWebhookRoute(request)) {
    return NextResponse.next();
  }

  // Verify the request with Arcjet
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);

    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // API routes need Clerk middleware so `auth()` works in route handlers — but
  // they bypass i18n routing.
  if (isApiRoute(request)) {
    // oxlint-disable-next-line typescript/return-await
    return clerkMiddleware()(request, event);
  }

  // Clerk keyless mode doesn't work with i18n, so we run it conditionally.
  if (isAuthPage(request) || isProtectedRoute(request)) {
    // oxlint-disable-next-line typescript/return-await
    return clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        const locale = req.nextUrl.pathname.match(/(\/.*)\/dashboard/u)?.at(1) ?? '';
        const signInUrl = new URL(`${locale}/sign-in`, publicOrigin(req));

        await auth.protect({
          unauthenticatedUrl: signInUrl.toString(),
        });
      }

      // Authenticated users hitting the sign-in/sign-up pages get redirected to
      // the dashboard server-side, before render — avoids the flash of the auth
      // page that Clerk's client-side fallback redirect would otherwise cause.
      if (isAuthPage(req)) {
        const { userId } = await auth();

        if (userId) {
          const locale = req.nextUrl.pathname.match(/^(\/[^/]+)\/sign-(?:in|up)/u)?.at(1) ?? '';

          return NextResponse.redirect(new URL(`${locale}/dashboard`, publicOrigin(req)));
        }
      }

      return handleI18nRouting(req);
    })(request, event);
  }

  return handleI18nRouting(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/_next`, `/_vercel` or `monitoring`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  // Note: `/api` is NOT excluded — Clerk middleware needs to run on it for
  // `auth()` to work in route handlers.
  matcher: '/((?!_next|_vercel|monitoring|.*\\..*).*)',
};
