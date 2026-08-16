import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function settings() {
  return {
    apiUrl: process.env.API_INTERNAL_URL ?? "http://api:3001",
    internalKey: process.env.INTERNAL_API_KEY ?? "",
  };
}

export async function GET(): Promise<NextResponse> {
  const { apiUrl, internalKey } = settings();
  try {
    const response = await fetch(`${apiUrl}/auth/recovery-email`, {
      headers: { "x-domain-manager-internal-key": internalKey },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ email: "", message: "Servizio autenticazione non raggiungibile." }, { status: 503 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  const { apiUrl, internalKey } = settings();
  try {
    const body: unknown = await request.json();
    const response = await fetch(`${apiUrl}/auth/recovery-email`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-domain-manager-internal-key": internalKey,
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    return NextResponse.json(await response.json(), { status: response.status });
  } catch {
    return NextResponse.json({ email: "", message: "Servizio autenticazione non raggiungibile." }, { status: 503 });
  }
}
