import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  const apiUrl = process.env.API_INTERNAL_URL ?? "http://api:3001";
  const internalKey = process.env.INTERNAL_API_KEY ?? "";
  try {
    const response = await fetch(`${apiUrl}/email/status`, {
      headers: { "x-domain-manager-internal-key": internalKey },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    const payload: unknown = await response.json();
    return NextResponse.json(payload, { status: response.status });
  } catch {
    return NextResponse.json(
      { provider: "postfix", configured: false, reachable: false, transport: "smtp-local", source: "none", host: "postfix", port: 25, from: "", message: "API Domain Manager non raggiungibile." },
      { status: 503 },
    );
  }
}
