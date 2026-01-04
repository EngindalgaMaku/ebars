import { NextRequest, NextResponse } from "next/server";
import jsPDF from "jspdf";

const API_GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ testId: string }> }
) {
  try {
    const { testId } = await params;

    // Forward the Authorization header from the original request
    const authHeader = request.headers.get("authorization");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (authHeader) {
      headers["authorization"] = authHeader;
    }

    // Get PDF report directly from backend export endpoint
    const response = await fetch(`${API_GATEWAY_URL}/api/chunking-test/export-pdf/${testId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Backend error" }));
      return NextResponse.json(
        { error: error.error || "PDF raporu alınamadı" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "application/pdf";
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(new Uint8Array(arrayBuffer), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="chunking_test_report_${testId.substring(0, 8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error("PDF export error:", error);
    return NextResponse.json(
      { error: error.message || "PDF oluşturulamadı" },
      { status: 500 }
    );
  }
}

function generateComprehensiveAcademicReportPDF(testData: any, testId: string): Buffer {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("tr-TR");
  const chunks = testData.chunks || [];
  const metrics = testData.metrics || {};
  
  // Calculate detailed metrics
  const semanticScores = chunks.map((c: any) => c.semanticScore || 0);
  const chunkSizes = chunks.map((c: any) => c.size || 0);
  
  const avgSemanticScore = semanticScores.length > 0
    ? semanticScores.reduce((a: number, b: number) => a + b, 0) / semanticScores.length
    : 0;
  
  const minSize = chunkSizes.length > 0 ? Math.min(...chunkSizes) : 0;
  const maxSize = chunkSizes.length > 0 ? Math.max(...chunkSizes) : 0;
  const stdDev = calculateStandardDeviation(chunkSizes);
  const cv = chunkSizes.length > 0 ? (stdDev / (chunkSizes.reduce((a: number, b: number) => a + b, 0) / chunkSizes.length)) * 100 : 0;

  // Set font
  doc.setFont("helvetica");
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(30, 64, 175);
  doc.text("Agentic Chunking Sistemi", 20, 20);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 116, 139);
  doc.text("Akademik Değerlendirme ve Performans Analizi Raporu", 20, 30);
  doc.text(`Test ID: ${testId} | Tarih: ${date}`, 20, 40);
  
  let yPos = 60;
  const margin = 20;
  const pageHeight = doc.internal.pageSize.height;
  
  // Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text("1. YÖNETİCİ ÖZETİ", margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const summaryData = [
    `Test Adı: ${testData.testName || 'Unnamed Test'}`,
    `Toplam Chunk Sayısı: ${chunks.length}`,
    `Ortalama Chunk Boyutu: ${Math.round(metrics.averageChunkSize || 0)} karakter`,
    `Semantik Uyum Skoru: ${(avgSemanticScore * 100).toFixed(1)}%`,
    `Başarı Oranı: ${testData.status === 'completed' ? '100' : '0'}%`,
    `İşlem Süresi: ${testData.processingTime || 0} saniye`
  ];
  
  summaryData.forEach(line => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    doc.text(line, margin, yPos);
    yPos += 8;
  });
  
  yPos += 10;
  
  // System Architecture
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text("2. SİSTEM MİMARİSİ", margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const architectureText = [
    "Agentic Chunking, yapay zeka tabanlı reasoning kullanarak",
    "semantik olarak anlamlı chunk sınırları belirleyen",
    "gelişmiş bir metin bölümleme stratejisidir.",
    "",
    "Temel Bileşenler:",
    "• Sequential Markdown Processor",
    "• Semantic Similarity Analyzer",
    "• Grok Reasoning Engine",
    "• Performance Optimizer",
    "• Quality Validator"
  ];
  
  architectureText.forEach(line => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    const splitText = doc.splitTextToSize(line, 170);
    doc.text(splitText, margin, yPos);
    yPos += splitText.length * 6;
  });
  
  yPos += 10;
  
  // Detailed Results
  if (yPos > pageHeight - 50) {
    doc.addPage();
    yPos = margin;
  }
  
  doc.setFontSize(14);
  doc.setTextColor(30, 64, 175);
  doc.text("3. DETAYLI SONUÇLAR", margin, yPos);
  yPos += 15;
  
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  const resultsData = [
    `Minimum Chunk Boyutu: ${minSize} karakter`,
    `Maksimum Chunk Boyutu: ${maxSize} karakter`,
    `Standart Sapma: ${stdDev.toFixed(1)} karakter`,
    `Varyasyon Katsayısı: ${cv.toFixed(1)}%`,
    "",
    "Chunk Kalite Dağılımı:",
    `• Mükemmel (≥90%): ${chunks.filter((c: any) => (c.semanticScore || 0) >= 0.9).length} chunks`,
    `• İyi (75-89%): ${chunks.filter((c: any) => (c.semanticScore || 0) >= 0.75 && (c.semanticScore || 0) < 0.9).length} chunks`,
    `• Orta (60-74%): ${chunks.filter((c: any) => (c.semanticScore || 0) >= 0.6 && (c.semanticScore || 0) < 0.75).length} chunks`,
    `• Zayıf (<60%): ${chunks.filter((c: any) => (c.semanticScore || 0) < 0.6).length} chunks`
  ];
  
  resultsData.forEach(line => {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    const splitText = doc.splitTextToSize(line, 170);
    doc.text(splitText, margin, yPos);
    yPos += splitText.length * 6;
  });
  
  // Add chunk details (first 5 chunks to avoid too long PDF)
  const chunksToShow = chunks.slice(0, 5);
  
  chunksToShow.forEach((chunk: any, index: number) => {
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }
    
    yPos += 10;
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(`Chunk #${index + 1}`, margin, yPos);
    yPos += 10;
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    const chunkInfo = [
      `Boyut: ${chunk.size || 0} karakter`,
      `Semantic Score: ${((chunk.semanticScore || 0) * 100).toFixed(1)}%`,
      `Boundary Type: ${chunk.boundaryType || 'semantic'}`,
      ""
    ];
    
    chunkInfo.forEach(line => {
      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = margin;
      }
      doc.text(line, margin, yPos);
      yPos += 6;
    });
    
    // Add chunk content (truncated)
    if (chunk.content) {
      const contentPreview = chunk.content.substring(0, 200) + (chunk.content.length > 200 ? "..." : "");
      const splitContent = doc.splitTextToSize(`İçerik: ${contentPreview}`, 170);
      
      splitContent.forEach((line: string) => {
        if (yPos > pageHeight - 30) {
          doc.addPage();
          yPos = margin;
        }
        doc.text(line, margin, yPos);
        yPos += 5;
      });
    }
    
    yPos += 5;
  });
  
  if (chunks.length > 5) {
    if (yPos > pageHeight - 30) {
      doc.addPage();
      yPos = margin;
    }
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`... ve ${chunks.length - 5} chunk daha`, margin, yPos);
  }
  
  return Buffer.from(doc.output('arraybuffer'));
}

function generatePDFFromMarkdown(markdown: string, testId: string): Buffer {
  const doc = new jsPDF();
  
  // Set font
  doc.setFont("helvetica");
  
  // Title
  doc.setFontSize(16);
  doc.setTextColor(30, 64, 175); // Blue color
  doc.text("Agentic Chunking Academic Report", 20, 20);
  
  // Test ID
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Gray color
  doc.text(`Test ID: ${testId}`, 20, 30);
  doc.text(`Date: ${new Date().toLocaleDateString("tr-TR")}`, 20, 35);
  
  // Content
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0); // Black color
  
  // Simple markdown parsing for PDF
  const lines = markdown.split('\n');
  let yPosition = 50;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  lines.forEach((line) => {
    if (yPosition > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    if (line.startsWith('# ')) {
      doc.setFontSize(14);
      doc.setTextColor(30, 64, 175);
      doc.text(line.substring(2), margin, yPosition);
      yPosition += 10;
    } else if (line.startsWith('## ')) {
      doc.setFontSize(12);
      doc.setTextColor(55, 65, 81);
      doc.text(line.substring(3), margin, yPosition);
      yPosition += 8;
    } else if (line.startsWith('### ')) {
      doc.setFontSize(11);
      doc.setTextColor(75, 85, 99);
      doc.text(line.substring(4), margin, yPosition);
      yPosition += 7;
    } else if (line.trim() !== '') {
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      const splitText = doc.splitTextToSize(line, 170);
      doc.text(splitText, margin, yPosition);
      yPosition += splitText.length * 5;
    } else {
      yPosition += 5;
    }
  });
  
  return Buffer.from(doc.output('arraybuffer'));
}

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map(value => Math.pow(value - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}