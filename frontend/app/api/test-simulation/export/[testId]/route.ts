import { NextRequest, NextResponse } from "next/server";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID gerekli" },
        { status: 400 }
      );
    }

    // Forward request to backend API gateway
    const response = await fetch(`${API_GATEWAY_URL}/api/test-simulation/export/${testId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: error.error || "Test export edilemedi" },
        { status: response.status }
      );
    }

    // Check if response is JSON or file
    const contentType = response.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      // Handle file download (PDF, Excel, etc.)
      const buffer = await response.arrayBuffer();
      const filename = response.headers.get("content-disposition")?.split("filename=")[1] || `test-${testId}-export.pdf`;
      
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Content-Disposition": `attachment; filename=${filename}`,
        },
      });
    }
  } catch (error: any) {
    console.error("Test export API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}