export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login
     * - /api/auth (Auth.js routes)
     * - /_next/static, /_next/image (Next.js internals)
     * - /favicon.ico, /sitemap.xml, /robots.txt
     */
    "/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt).*)",
  ],
};
