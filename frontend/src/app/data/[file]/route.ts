import { NextResponse, type NextRequest } from "next/server";

import { ApiError, apiCsv } from "@/lib/api";

/** /data/mp-records.csv: the API's CSV, passed through, since the browser never talks to the API. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = /^([a-z-]+)\.csv$/.exec(file)?.[1];
  if (!id) return new NextResponse("Not found", { status: 404 });
  try {
    const csv = await apiCsv(`/api/data/${id}.csv`);
    return new NextResponse(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="civiclens-${id}.csv"`,
      },
    });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return new NextResponse(status === 404 ? "There's no dataset with that name." : "Please try again later.", {
      status,
    });
  }
}
