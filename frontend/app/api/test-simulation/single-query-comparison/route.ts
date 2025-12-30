import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.query) {
      return NextResponse.json(
        { error: "Query gerekli" },
        { status: 400 }
      );
    }

    if (!body.methods || !Array.isArray(body.methods) || body.methods.length === 0) {
      return NextResponse.json(
        { error: "En az bir method seçilmeli" },
        { status: 400 }
      );
    }

    // Forward request to backend API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/test-simulation/single-query-comparison`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: error.error || "Single query comparison başarısız" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Single query comparison API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}