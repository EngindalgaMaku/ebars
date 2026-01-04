import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "json";

    // Forward the Authorization header from the original request
    const authHeader = request.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (authHeader) {
      headers["authorization"] = authHeader;
    }

    // Forward request to backend API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/chunking-test/export/${testId}?format=${format}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: error.error || "Export başarısız" },
        { status: response.status }
      );
    }

    // Handle different content types based on format
    if (format === "json") {
      const data = await response.json();
      return NextResponse.json(data);
    } else if (format === "csv" || format === "txt") {
      const text = await response.text();
      return new NextResponse(text, {
        headers: {
          "Content-Type": format === "csv" ? "text/csv" : "text/plain",
          "Content-Disposition": `attachment; filename="chunking_test_${testId}.${format}"`,
        },
      });
    } else {
      const data = await response.json();
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error("Chunking test export API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}