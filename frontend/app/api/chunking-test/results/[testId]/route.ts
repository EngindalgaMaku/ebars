import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { testId: string } }
) {
  try {
    const { testId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // Get authorization header from request
    const authHeader = request.headers.get('authorization');
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    // Forward request to backend API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/chunking-test/results/${testId}?format=${format}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: error.error || "Test sonuçları alınamadı" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Chunking test results API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}