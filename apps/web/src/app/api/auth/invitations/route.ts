import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";
  const internalKey = process.env.INTERNAL_API_KEY ?? "";
  try {
    const body: unknown = await request.json();
    const response = await fetch(`${apiUrl}/auth/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-domain-manager-internal-key": internalKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20_000),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ created: false, queued: false, message: "Servizio inviti non raggiungibile." }, { status: 503 });
  }
}
