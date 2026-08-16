import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

function apiSettings() {
  return {
    apiUrl: process.env.API_INTERNAL_URL ?? "http://api:3001",
    internalKey: process.env.INTERNAL_API_KEY ?? "",
  };
}

async function forward(method: "GET" | "PUT" | "DELETE", request?: NextRequest): Promise<NextResponse> {
  const { apiUrl, internalKey } = apiSettings();
  try {
    const body = method === "PUT" && request ? JSON.stringify(await request.json()) : undefined;
    const response = await fetch(`${apiUrl}/email/config`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        "x-domain-manager-internal-key": internalKey,
      },
      ...(body ? { body } : {}),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      {
        provider: "postfix", configured: false, reachable: false, transport: "smtp-local",
        source: "none", host: "postfix", port: 25, from: "", fromName: "Domain Manager",
        fromEmail: "", message: "API Domain Manager non raggiungibile.",
      },
      { status: 503 },
    );
  }
}

export async function GET(): Promise<NextResponse> { return forward("GET"); }
export async function PUT(request: NextRequest): Promise<NextResponse> { return forward("PUT", request); }
export async function DELETE(): Promise<NextResponse> { return forward("DELETE"); }
