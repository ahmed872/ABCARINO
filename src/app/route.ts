import { NextResponse, type NextRequest } from "next/server";
import { querySettings } from "@/lib/content/queries";
import { isLocale, LOCALE_COOKIE, negotiateLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

/** "/" → the visitor's language (cookie → browser preference → admin default). */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  let locale: Locale;
  if (isLocale(cookie)) {
    locale = cookie;
  } else {
    let fallback: Locale = "en";
    try {
      fallback = (await querySettings()).localization.defaultLocale;
    } catch {
      /* database unavailable: fall back to English */
    }
    locale = negotiateLocale(request.headers.get("accept-language"), fallback);
  }
  // Relative Location: behind a reverse proxy request.nextUrl carries the server's
  // bind address (e.g. 0.0.0.0:3000 in Docker), not the public host.
  return new NextResponse(null, { status: 307, headers: { Location: `/${locale}${request.nextUrl.search}` } });
}
