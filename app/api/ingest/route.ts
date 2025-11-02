import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (request.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("zip");

    if (!(file instanceof Blob)) {
      return NextResponse.json({ error: "Missing zip file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length === 0) {
      return NextResponse.json({ error: "Zip file is empty" }, { status: 400 });
    }

    const zip = new AdmZip(buffer);
    const entries = zip
      .getEntries()
      .filter((entry) => !entry.isDirectory && entry.entryName.toLowerCase().endsWith(".xlsx"));

    if (entries.length === 0) {
      return NextResponse.json({ error: "No .xlsx files found in archive" }, { status: 400 });
    }

    // Parse the Excel files to validate them
    const tables: { name: string; sheets: number; estimatedRows: number }[] = [];

    for (const entry of entries) {
      try {
        const workbook = XLSX.read(entry.getData(), { type: "buffer", cellDates: true });
        let totalSheetRows = 0;

        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          if (!sheet) continue;

          const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
            header: 1,
            raw: false,
            defval: null,
            blankrows: false,
          });

          if (Array.isArray(rows) && rows.length > 1) {
            totalSheetRows += rows.length - 1; // Subtract header row
          }
        }

        tables.push({
          name: entry.entryName,
          sheets: workbook.SheetNames.length,
          estimatedRows: totalSheetRows,
        });
      } catch (error) {
        console.error(`Failed to parse ${entry.entryName}:`, error);
      }
    }

    // Temporarily disabled for Vercel deployment
    // Database functionality will be re-enabled with a Vercel-compatible solution
    return NextResponse.json({
      ok: true,
      message: "File validated successfully. Database storage temporarily disabled for Vercel deployment.",
      files: tables,
      note: "Data ingestion is being migrated to a Vercel-compatible database solution.",
    });
  } catch (error) {
    console.error("/api/ingest error", error);
    return NextResponse.json(
      {
        error: "Failed to process upload",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
