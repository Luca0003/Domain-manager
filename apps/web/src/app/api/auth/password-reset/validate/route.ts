import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";
  const internalKey = process.env.INTERNAL_API_KEY ?? "";
  const token = request.nextUrl.searchParams.get("token") ?? "";
  try {
    const response = await fetch(`${apiUrl}/auth/password-reset/validate?token=${encodeURIComponent(token)}`, {
      headers: { "x-domain-manager-internal-key": internalKey },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ valid: false, message: "Servizio reset password non raggiungibile." }, { status: 503 });
  }
}
