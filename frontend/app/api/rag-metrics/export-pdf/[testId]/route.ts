import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    // Forward auth headers/cookies so behavior matches direct /api rewrite proxying.
    const forwardedHeaders: Record<string, string> = {};
    const auth = request.headers.get("authorization");
    if (auth) forwardedHeaders["authorization"] = auth;
    const cookie = request.headers.get("cookie");
    if (cookie) forwardedHeaders["cookie"] = cookie;

    const response = await fetch(
      `${API_GATEWAY_URL}/api/rag-metrics/export-pdf/${testId}`,
      {
        method: "GET",
        headers: forwardedHeaders,
      }
    );

    if (!response.ok) {
      const contentType = response.headers.get("content-type") || "";
      const errorBody = contentType.includes("application/json")
        ? await response.json().catch(() => ({ error: "Backend error" }))
        : { error: await response.text().catch(() => "Backend error") };

      return NextResponse.json(
        {
          error:
            (errorBody as any).detail || (errorBody as any).error || "PDF oluşturulamadı",
        },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();

    const headers = new Headers();
    headers.set(
      "Content-Type",
      response.headers.get("content-type") || "application/pdf"
    );
    const contentDisposition = response.headers.get("content-disposition");
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);
    const cacheControl = response.headers.get("cache-control");
    if (cacheControl) headers.set("Cache-Control", cacheControl);

    return new NextResponse(arrayBuffer, { status: response.status, headers });
  } catch (error: any) {
    console.error("RAGAS export-pdf API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
