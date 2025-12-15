import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

// Types for export data
interface TestResult {
  testId: string;
  testName: string;
  status: string;
  progress: number;
  startTime: string;
  endTime?: string;
  executionTime?: {
    total_seconds?: number;
    total_minutes?: number;
    formatted?: string;
  };
  metrics: any;
  methodComparison: any;
  benchmarkComparison: any;
  questions?: any[];
}

interface ExportOptions {
  filename?: string;
  format?: "png" | "jpg" | "pdf";
  quality?: number;
  includeTimestamp?: boolean;
}

// Chart Export Functions
export class ChartExporter {
  /**
   * Export a chart element as PNG/JPG image
   */
  static async exportChartAsImage(
    elementId: string,
    options: ExportOptions = {}
  ): Promise<void> {
    const {
      filename = "chart",
      format = "png",
      quality = 0.95,
      includeTimestamp = true,
    } = options;

    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with ID '${elementId}' not found`);
      }

      // Create canvas from element
      const canvas = await html2canvas(element, {
        backgroundColor: "#ffffff",
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: false,
        logging: false,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });

      // Generate filename with timestamp
      const timestamp = includeTimestamp
        ? `_${new Date().toISOString().split("T")[0].replace(/-/g, "")}`
        : "";

      const finalFilename = `${filename}${timestamp}.${format}`;

      // Convert canvas to blob and download
      canvas.toBlob(
        (blob) => {
          if (blob) {
            saveAs(blob, finalFilename);
          }
        },
        `image/${format}`,
        quality
      );
    } catch (error) {
      console.error("Chart export error:", error);
      throw new Error(
        `Failed to export chart: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Export multiple charts as PDF document
   */
  static async exportChartsAsPDF(
    chartIds: string[],
    options: {
      filename?: string;
      title?: string;
      includeMetadata?: boolean;
    } = {}
  ): Promise<void> {
    const {
      filename = "charts_export",
      title = "Test Simulation Charts",
      includeMetadata = true,
    } = options;

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Add title page
      pdf.setFontSize(20);
      pdf.text(title, margin, 30);

      if (includeMetadata) {
        pdf.setFontSize(12);
        pdf.text(
          `Export Date: ${new Date().toLocaleDateString("tr-TR")}`,
          margin,
          45
        );
        pdf.text(
          `Export Time: ${new Date().toLocaleTimeString("tr-TR")}`,
          margin,
          55
        );
      }

      let yPosition = 80;

      // Process each chart
      for (let i = 0; i < chartIds.length; i++) {
        const element = document.getElementById(chartIds[i]);
        if (!element) continue;

        // Add new page for each chart (except first)
        if (i > 0) {
          pdf.addPage();
          yPosition = margin;
        }

        try {
          const canvas = await html2canvas(element, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            useCORS: true,
            logging: false,
          });

          const imgData = canvas.toDataURL("image/jpeg", 0.8);
          const imgWidth = contentWidth;
          const imgHeight = (canvas.height * contentWidth) / canvas.width;

          // Check if image fits on current page
          if (yPosition + imgHeight > pageHeight - margin) {
            pdf.addPage();
            yPosition = margin;
          }

          pdf.addImage(imgData, "JPEG", margin, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error(`Error exporting chart ${chartIds[i]}:`, error);
          // Continue with next chart
        }
      }

      // Save PDF
      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      pdf.save(`${filename}_${timestamp}.pdf`);
    } catch (error) {
      console.error("PDF export error:", error);
      throw new Error(
        `Failed to export PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Data Export Functions
export class DataExporter {
  /**
   * Export comprehensive test results as Excel file
   */
  static exportAsExcel(testResult: TestResult): void {
    try {
      const workbook = XLSX.utils.book_new();

      // Summary Sheet
      const summaryData = [
        ["Test Report Summary", ""],
        ["Test Name", testResult.testName],
        ["Test ID", testResult.testId],
        ["Status", testResult.status],
        ["Start Time", new Date(testResult.startTime).toLocaleString("tr-TR")],
        [
          "End Time",
          testResult.endTime
            ? new Date(testResult.endTime).toLocaleString("tr-TR")
            : "N/A",
        ],
        ["Duration", testResult.executionTime?.formatted || "N/A"],
        ["Total Questions", testResult.metrics?.totalQuestions || 0],
        ["Correct Answers", testResult.metrics?.correctAnswers || 0],
        [
          "Success Rate (%)",
          testResult.metrics?.totalQuestions
            ? (
                (testResult.metrics.correctAnswers /
                  testResult.metrics.totalQuestions) *
                100
              ).toFixed(2)
            : "0",
        ],
        [""],
        ["Overall Metrics", ""],
        [
          "Average Cosine Similarity",
          testResult.metrics?.cosineSimilarity?.toFixed(4) || "N/A",
        ],
        [
          "Average Precision@5 (%)",
          testResult.metrics?.precisionAt5?.toFixed(2) || "N/A",
        ],
        [
          "Average Precision@10 (%)",
          testResult.metrics?.precisionAt10?.toFixed(2) || "N/A",
        ],
        [
          "Average Response Time (ms)",
          testResult.metrics?.avgResponseTime?.toFixed(0) || "N/A",
        ],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

      // Method Comparison Sheet
      if (testResult.methodComparison) {
        const methodData = [
          ["Method Comparison Analysis", "", "", "", "", "", "", "", ""],
          [
            "Method",
            "Cosine Similarity",
            "Precision@5 (%)",
            "Precision@10 (%)",
            "Avg Response Time (ms)",
            "Accuracy (%)",
            "Semantic Similarity",
            "BLEU Score",
            "ROUGE-L",
            "F1 Score",
          ],
        ];

        Object.entries(testResult.methodComparison).forEach(
          ([method, results]: [string, any]) => {
            const methodNames = {
              eduBars: "AkıllıRehber Tam Sistem",
              basicRag: "Basit RAG",
              llmOnly: "Sadece LLM",
            };

            const getSimilarityMetric = (results: any, key: string) => {
              return results?.similarity?.[key] !== undefined
                ? results.similarity[key].toFixed(4)
                : results?.answerQualitySimilarity &&
                  key === "semanticSimilarity"
                ? results.answerQualitySimilarity.toFixed(4)
                : "N/A";
            };

            methodData.push([
              methodNames[method as keyof typeof methodNames] || method,
              results.cosineSimilarity?.toFixed(4) || "N/A",
              results.precisionAt5?.toFixed(2) || "N/A",
              results.precisionAt10?.toFixed(2) || "N/A",
              results.avgResponseTime?.toFixed(0) || "N/A",
              results.accuracy?.toFixed(2) || "N/A",
              getSimilarityMetric(results, "semanticSimilarity"),
              getSimilarityMetric(results, "bleuScore"),
              getSimilarityMetric(results, "rougeL"),
              getSimilarityMetric(results, "f1Score"),
            ]);
          }
        );

        const methodSheet = XLSX.utils.aoa_to_sheet(methodData);
        XLSX.utils.book_append_sheet(
          workbook,
          methodSheet,
          "Method Comparison"
        );
      }

      // Detailed Question Results Sheet
      if (testResult.questions && testResult.questions.length > 0) {
        const questionData = [
          ["Detailed Question Analysis", "", "", "", "", "", "", "", "", ""],
          [
            "Question ID",
            "Question",
            "Method",
            "Response",
            "Max Similarity",
            "Cosine Similarity",
            "Precision@5",
            "Response Time (ms)",
            "Semantic Similarity",
            "BLEU",
            "ROUGE-L",
            "F1",
          ],
        ];

        testResult.questions.forEach((question: any) => {
          Object.entries(question.methodologies).forEach(
            ([method, results]: [string, any]) => {
              const methodNames = {
                eduBars: "AkıllıRehber",
                basicRag: "Basit RAG",
                llmOnly: "Sadece LLM",
              };

              const getSimilarityMetric = (results: any, key: string) => {
                return results?.similarity?.[key] !== undefined
                  ? results.similarity[key].toFixed(4)
                  : results?.answer_quality_similarity &&
                    key === "semanticSimilarity"
                  ? results.answer_quality_similarity.toFixed(4)
                  : "N/A";
              };

              questionData.push([
                question.question_id,
                question.question.substring(0, 100) +
                  (question.question.length > 100 ? "..." : ""),
                methodNames[method as keyof typeof methodNames] || method,
                results.response
                  ? results.response.substring(0, 200) +
                    (results.response.length > 200 ? "..." : "")
                  : "N/A",
                results.max_similarity?.toFixed(4) || "N/A",
                results.cosine_similarity?.toFixed(4) || "N/A",
                results.precision_at_5
                  ? (results.precision_at_5 * 100).toFixed(2) + "%"
                  : "N/A",
                results.response_time_ms?.toFixed(0) || "N/A",
                getSimilarityMetric(results, "semanticSimilarity"),
                getSimilarityMetric(results, "bleuScore"),
                getSimilarityMetric(results, "rougeL"),
                getSimilarityMetric(results, "f1Score"),
              ]);
            }
          );
        });

        const questionSheet = XLSX.utils.aoa_to_sheet(questionData);
        XLSX.utils.book_append_sheet(
          workbook,
          questionSheet,
          "Question Details"
        );
      }

      // Benchmark Comparison Sheet (if available)
      if (testResult.benchmarkComparison) {
        const benchmarkData = [
          ["Benchmark Comparison", "", ""],
          ["System", "Cosine Similarity", "Precision@5 (%)"],
          [
            "EkoBot Reference",
            testResult.benchmarkComparison.ekoBot?.cosineSimilarity?.toFixed(
              4
            ) || "N/A",
            testResult.benchmarkComparison.ekoBot?.precisionAt5?.toFixed(2) ||
              "N/A",
          ],
          [
            "Current Test",
            testResult.benchmarkComparison.current?.cosineSimilarity?.toFixed(
              4
            ) || "N/A",
            testResult.benchmarkComparison.current?.precisionAt5?.toFixed(2) ||
              "N/A",
          ],
          [""],
          ["Performance vs Benchmark", ""],
          [
            "Similarity Difference",
            testResult.benchmarkComparison.current &&
            testResult.benchmarkComparison.ekoBot
              ? (
                  testResult.benchmarkComparison.current.cosineSimilarity -
                  testResult.benchmarkComparison.ekoBot.cosineSimilarity
                ).toFixed(4)
              : "N/A",
          ],
          [
            "Improvement (%)",
            testResult.benchmarkComparison.current &&
            testResult.benchmarkComparison.ekoBot
              ? (
                  ((testResult.benchmarkComparison.current.cosineSimilarity -
                    testResult.benchmarkComparison.ekoBot.cosineSimilarity) /
                    testResult.benchmarkComparison.ekoBot.cosineSimilarity) *
                  100
                ).toFixed(2) + "%"
              : "N/A",
          ],
        ];

        const benchmarkSheet = XLSX.utils.aoa_to_sheet(benchmarkData);
        XLSX.utils.book_append_sheet(workbook, benchmarkSheet, "Benchmark");
      }

      // Generate filename and save
      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      const filename = `${testResult.testName}_comprehensive_report_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error("Excel export error:", error);
      throw new Error(
        `Failed to export Excel file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Export comprehensive test results as CSV
   */
  static exportAsCSV(testResult: TestResult): void {
    try {
      const csvData = [];

      // Header information
      csvData.push(["Test Report - CSV Export"]);
      csvData.push(["Generated:", new Date().toLocaleString("tr-TR")]);
      csvData.push([""]);
      csvData.push(["Test Information"]);
      csvData.push(["Test Name:", testResult.testName]);
      csvData.push(["Test ID:", testResult.testId]);
      csvData.push(["Status:", testResult.status]);
      csvData.push(["Duration:", testResult.executionTime?.formatted || "N/A"]);
      csvData.push([""]);

      // Overall metrics
      csvData.push(["Overall Performance Metrics"]);
      csvData.push(["Metric", "Value"]);
      csvData.push([
        "Total Questions",
        testResult.metrics?.totalQuestions || 0,
      ]);
      csvData.push([
        "Correct Answers",
        testResult.metrics?.correctAnswers || 0,
      ]);
      csvData.push([
        "Success Rate (%)",
        testResult.metrics?.totalQuestions
          ? (
              (testResult.metrics.correctAnswers /
                testResult.metrics.totalQuestions) *
              100
            ).toFixed(2)
          : "0",
      ]);
      csvData.push([
        "Average Cosine Similarity",
        testResult.metrics?.cosineSimilarity?.toFixed(4) || "N/A",
      ]);
      csvData.push([
        "Average Precision@5 (%)",
        testResult.metrics?.precisionAt5?.toFixed(2) || "N/A",
      ]);
      csvData.push([
        "Average Precision@10 (%)",
        testResult.metrics?.precisionAt10?.toFixed(2) || "N/A",
      ]);
      csvData.push([
        "Average Response Time (ms)",
        testResult.metrics?.avgResponseTime?.toFixed(0) || "N/A",
      ]);
      csvData.push([""]);

      // Method comparison
      if (testResult.methodComparison) {
        csvData.push(["Method Comparison"]);
        csvData.push([
          "Method",
          "Cosine Similarity",
          "Precision@5 (%)",
          "Precision@10 (%)",
          "Avg Response Time (ms)",
          "Accuracy (%)",
          "Semantic Similarity",
          "BLEU",
          "ROUGE-L",
          "F1",
        ]);

        Object.entries(testResult.methodComparison).forEach(
          ([method, results]: [string, any]) => {
            const methodNames = {
              eduBars: "AkıllıRehber Tam Sistem",
              basicRag: "Basit RAG",
              llmOnly: "Sadece LLM",
            };

            const getSimilarityMetric = (results: any, key: string) => {
              return results?.similarity?.[key] !== undefined
                ? results.similarity[key].toFixed(4)
                : results?.answerQualitySimilarity &&
                  key === "semanticSimilarity"
                ? results.answerQualitySimilarity.toFixed(4)
                : "N/A";
            };

            csvData.push([
              methodNames[method as keyof typeof methodNames] || method,
              results.cosineSimilarity?.toFixed(4) || "N/A",
              results.precisionAt5?.toFixed(2) || "N/A",
              results.precisionAt10?.toFixed(2) || "N/A",
              results.avgResponseTime?.toFixed(0) || "N/A",
              results.accuracy?.toFixed(2) || "N/A",
              getSimilarityMetric(results, "semanticSimilarity"),
              getSimilarityMetric(results, "bleuScore"),
              getSimilarityMetric(results, "rougeL"),
              getSimilarityMetric(results, "f1Score"),
            ]);
          }
        );
        csvData.push([""]);
      }

      // Convert to CSV string
      const csvContent = csvData
        .map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        )
        .join("\n");

      // Add BOM for proper UTF-8 encoding in Excel
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], {
        type: "text/csv;charset=utf-8;",
      });

      // Generate filename and save
      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      const filename = `${testResult.testName}_report_${timestamp}.csv`;

      saveAs(blob, filename);
    } catch (error) {
      console.error("CSV export error:", error);
      throw new Error(
        `Failed to export CSV file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  /**
   * Export test results as comprehensive JSON
   */
  static exportAsJSON(testResult: TestResult): void {
    try {
      const exportData = {
        exportMetadata: {
          exportDate: new Date().toISOString(),
          exportVersion: "1.0",
          dataFormat: "comprehensive_test_results",
        },
        testInformation: {
          testId: testResult.testId,
          testName: testResult.testName,
          status: testResult.status,
          startTime: testResult.startTime,
          endTime: testResult.endTime,
          duration: testResult.executionTime,
          progress: testResult.progress,
        },
        overallMetrics: testResult.metrics,
        methodComparison: testResult.methodComparison,
        benchmarkComparison: testResult.benchmarkComparison,
        detailedResults: testResult.questions,
        statistics: {
          totalQuestions: testResult.questions?.length || 0,
          questionsWithGroundTruth:
            testResult.questions?.filter((q) => q.expected_answer).length || 0,
          methodsTested: Object.keys(testResult.methodComparison || {}).length,
          averageResponseTime: testResult.metrics?.avgResponseTime,
          bestPerformingMethod: this.getBestPerformingMethod(
            testResult.methodComparison
          ),
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], {
        type: "application/json;charset=utf-8;",
      });

      // Generate filename and save
      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      const filename = `${testResult.testName}_comprehensive_${timestamp}.json`;

      saveAs(blob, filename);
    } catch (error) {
      console.error("JSON export error:", error);
      throw new Error(
        `Failed to export JSON file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  static getBestPerformingMethod(methodComparison: any): string {
    if (!methodComparison) return "N/A";

    let bestMethod = "";
    let bestScore = -1;

    Object.entries(methodComparison).forEach(
      ([method, results]: [string, any]) => {
        const score = results.cosineSimilarity || 0;
        if (score > bestScore) {
          bestScore = score;
          bestMethod = method;
        }
      }
    );

    const methodNames = {
      eduBars: "AkıllıRehber Tam Sistem",
      basicRag: "Basit RAG",
      llmOnly: "Sadece LLM",
    };

    return methodNames[bestMethod as keyof typeof methodNames] || bestMethod;
  }
}

// Academic Report Generator
export class AcademicReportGenerator {
  /**
   * Generate a comprehensive academic report as PDF
   */
  static async generateAcademicPDF(
    testResult: TestResult,
    chartIds: string[]
  ): Promise<void> {
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Title Page
      pdf.setFontSize(24);
      pdf.text("RAG Sistem Performans Analizi", pageWidth / 2, 40, {
        align: "center",
      });

      pdf.setFontSize(18);
      pdf.text("Test Simülasyon Raporu", pageWidth / 2, 55, {
        align: "center",
      });

      pdf.setFontSize(14);
      pdf.text(testResult.testName, pageWidth / 2, 70, { align: "center" });

      pdf.setFontSize(12);
      const reportDate = new Date().toLocaleDateString("tr-TR");
      pdf.text(`Rapor Tarihi: ${reportDate}`, pageWidth / 2, 85, {
        align: "center",
      });

      // Abstract/Summary
      pdf.setFontSize(16);
      pdf.text("ÖZET", margin, 110);

      pdf.setFontSize(12);
      const abstractText = `Bu rapor, AkıllıRehber sisteminin performansını analiz etmek için gerçekleştirilen test simülasyonunun sonuçlarını içermektedir. Test ${
        testResult.metrics?.totalQuestions || 0
      } soru üzerinde ${
        Object.keys(testResult.methodComparison || {}).length
      } farklı metodoloji ile yürütülmüştür. Genel cosine similarity değeri ${
        testResult.metrics?.cosineSimilarity?.toFixed(4) || "N/A"
      }, ortalama yanıt süresi ${
        testResult.metrics?.avgResponseTime?.toFixed(0) || "N/A"
      } milisaniye olarak ölçülmüştür.`;

      pdf.text(abstractText, margin, 125, {
        maxWidth: contentWidth,
        align: "justify",
      });

      // Test Detayları
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("1. TEST DETAYLARI", margin, 30);

      pdf.setFontSize(12);
      let yPos = 45;
      const testDetails = [
        ["Test Adı:", testResult.testName],
        ["Test ID:", testResult.testId],
        ["Durum:", testResult.status],
        ["Başlangıç:", new Date(testResult.startTime).toLocaleString("tr-TR")],
        [
          "Bitiş:",
          testResult.endTime
            ? new Date(testResult.endTime).toLocaleString("tr-TR")
            : "N/A",
        ],
        ["Süre:", testResult.executionTime?.formatted || "N/A"],
        ["Toplam Soru:", String(testResult.metrics?.totalQuestions || 0)],
        ["Doğru Cevap:", String(testResult.metrics?.correctAnswers || 0)],
      ];

      testDetails.forEach(([label, value]) => {
        pdf.text(`${label}`, margin, yPos);
        pdf.text(value, margin + 50, yPos);
        yPos += 8;
      });

      // Metodoloji Karşılaştırması
      yPos += 10;
      pdf.setFontSize(16);
      pdf.text("2. METODOLOJI KARŞILAŞTIRMASI", margin, yPos);

      yPos += 15;
      if (testResult.methodComparison) {
        const methods = Object.entries(testResult.methodComparison);
        methods.forEach(([method, results]: [string, any], index) => {
          const methodNames = {
            eduBars: "AkıllıRehber Tam Sistem",
            basicRag: "Basit RAG",
            llmOnly: "Sadece LLM",
          };

          pdf.setFontSize(14);
          pdf.text(
            `2.${index + 1} ${
              methodNames[method as keyof typeof methodNames] || method
            }`,
            margin,
            yPos
          );
          yPos += 10;

          pdf.setFontSize(12);
          const methodMetrics = [
            [
              "Cosine Similarity:",
              results.cosineSimilarity?.toFixed(4) || "N/A",
            ],
            ["Precision@5:", `${results.precisionAt5?.toFixed(2) || "N/A"}%`],
            ["Precision@10:", `${results.precisionAt10?.toFixed(2) || "N/A"}%`],
            [
              "Ortalama Yanıt Süresi:",
              `${results.avgResponseTime?.toFixed(0) || "N/A"} ms`,
            ],
            ["Doğruluk:", `${results.accuracy?.toFixed(2) || "N/A"}%`],
          ];

          methodMetrics.forEach(([label, value]) => {
            pdf.text(`  ${label}`, margin + 5, yPos);
            pdf.text(value, margin + 70, yPos);
            yPos += 6;
          });
          yPos += 5;

          // Check if we need a new page
          if (yPos > pageHeight - 40) {
            pdf.addPage();
            yPos = 30;
          }
        });
      }

      // Add charts if provided
      if (chartIds.length > 0) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text("3. GÖRSELLEŞTİRMELER", margin, 30);

        yPos = 50;

        for (let i = 0; i < chartIds.length; i++) {
          const element = document.getElementById(chartIds[i]);
          if (!element) continue;

          try {
            const canvas = await html2canvas(element, {
              backgroundColor: "#ffffff",
              scale: 1.2,
              useCORS: true,
              logging: false,
            });

            const imgData = canvas.toDataURL("image/jpeg", 0.7);
            const imgWidth = contentWidth;
            const imgHeight = (canvas.height * contentWidth) / canvas.width;

            // Check if image fits on current page
            if (yPos + imgHeight > pageHeight - margin) {
              pdf.addPage();
              yPos = margin;
            }

            pdf.addImage(
              imgData,
              "JPEG",
              margin,
              yPos,
              imgWidth,
              Math.min(imgHeight, 100)
            );
            yPos += Math.min(imgHeight, 100) + 15;
          } catch (error) {
            console.error(`Error adding chart ${chartIds[i]} to PDF:`, error);
          }
        }
      }

      // Sonuç ve Öneriler
      pdf.addPage();
      pdf.setFontSize(16);
      pdf.text("4. SONUÇ VE ÖNERİLER", margin, 30);

      pdf.setFontSize(12);
      const bestMethod = DataExporter.getBestPerformingMethod(
        testResult.methodComparison
      );
      const conclusionText = `Test sonuçlarına göre en iyi performans gösteren yöntem "${bestMethod}" olmuştur. Sistem genel olarak ${(
        ((testResult.metrics?.correctAnswers || 0) /
          (testResult.metrics?.totalQuestions || 1)) *
        100
      ).toFixed(
        1
      )}% başarı oranı ile çalışmıştır. Gelecek geliştirmeler için yanıt süresi optimizasyonu ve doğruluk oranının artırılması önerilmektedir.`;

      pdf.text(conclusionText, margin, 45, {
        maxWidth: contentWidth,
        align: "justify",
      });

      // Save PDF
      const timestamp = new Date()
        .toISOString()
        .split("T")[0]
        .replace(/-/g, "");
      pdf.save(`${testResult.testName}_academic_report_${timestamp}.pdf`);
    } catch (error) {
      console.error("Academic PDF export error:", error);
      throw new Error(
        `Failed to generate academic PDF: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}

// Utility function to show export progress
export const showExportProgress = (message: string) => {
  // This can be enhanced with a proper toast/notification system
  console.log(`Export Progress: ${message}`);
};

// Export success/error handlers
export const handleExportSuccess = (format: string, filename?: string) => {
  const message = filename
    ? `${format.toUpperCase()} export completed: ${filename}`
    : `${format.toUpperCase()} export completed successfully!`;
  console.log(message);
  // This can be enhanced with toast notifications
};

export const handleExportError = (format: string, error: Error) => {
  const message = `${format.toUpperCase()} export failed: ${error.message}`;
  console.error(message);
  // This can be enhanced with toast notifications
};
