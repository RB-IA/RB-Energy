import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const { sql } = (await request.json().catch(() => ({}))) as { sql?: unknown };
    if (typeof sql !== "string") {
      return NextResponse.json({ error: "Missing sql" }, { status: 400 });
    }

    // Temporarily disabled for Vercel deployment
    // DuckDB requires native binaries that don't work well in serverless environments
    return NextResponse.json(
      {
        error: "SQL queries temporarily disabled",
        details: "Database functionality is being migrated to a Vercel-compatible solution. Please upload data first using the ingest API.",
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("/api/sql error", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to process request",
        details: message,
      },
      { status: 500 }
    );
  }
}
