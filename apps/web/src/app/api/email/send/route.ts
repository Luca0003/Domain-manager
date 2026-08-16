import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";
  const internalKey = process.env.INTERNAL_API_KEY ?? "";
  const idempotencyKey = request.headers.get("x-idempotency-key") ?? `web/${crypto.randomUUID()}`;
  try {
    const body: unknown = await request.json();
    const response = await fetch(`${apiUrl}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-domain-manager-internal-key": internalKey,
        "x-idempotency-key": idempotencyKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { sent: false, configured: false, provider: "postfix", message: "Servizio email non raggiungibile." },
      { status: 503 },
    );
  }
}
