"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileSpreadsheet,
  FileText,
  Database,
  Loader2,
  FileIcon,
  BookOpen,
} from "lucide-react";
import {
  DataExporter,
  ChartExporter,
  AcademicReportGenerator,
  handleExportSuccess,
  handleExportError,
} from "@/utils/exportUtils";
import { toast } from "@/lib/toast";

interface DataExportControlsProps {
  testResult: any;
  chartIds?: string[];
  className?: string;
  variant?: "full" | "compact";
  showAcademicReport?: boolean;
}

const DataExportControls: React.FC<DataExportControlsProps> = ({
  testResult,
  chartIds = [],
  className = "",
  variant = "full",
  showAcademicReport = true,
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string>("");

  const exportData = async (format: "excel" | "csv" | "json") => {
    if (isExporting || !testResult) return;

    try {
      setIsExporting(true);
      setExportingFormat(format);

      switch (format) {
        case "excel":
          DataExporter.exportAsExcel(testResult);
          toast.success("Excel dosyası başarıyla indirildi!");
          break;
        case "csv":
          DataExporter.exportAsCSV(testResult);
          toast.success("CSV dosyası başarıyla indirildi!");
          break;
        case "json":
          DataExporter.exportAsJSON(testResult);
          toast.success("JSON dosyası başarıyla indirildi!");
          break;
      }

      handleExportSuccess(format);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      handleExportError(format, new Error(errorMessage));
      toast.error(`${format.toUpperCase()} export hatası: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportingFormat("");
    }
  };

  const exportAcademicReport = async () => {
    if (isExporting || !testResult) return;

    try {
      setIsExporting(true);
      setExportingFormat("academic");

      await AcademicReportGenerator.generateAcademicPDF(testResult, chartIds);
      toast.success("Akademik rapor başarıyla oluşturuldu!");
      handleExportSuccess("academic PDF");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      handleExportError("academic PDF", new Error(errorMessage));
      toast.error(`Akademik rapor hatası: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportingFormat("");
    }
  };

  const exportAllCharts = async () => {
    if (isExporting || chartIds.length === 0) return;

    try {
      setIsExporting(true);
      setExportingFormat("charts");

      await ChartExporter.exportChartsAsPDF(chartIds, {
        filename: `${testResult.testName}_charts`,
        title: `${testResult.testName} - Tüm Grafikler`,
        includeMetadata: true,
      });

      toast.success("Tüm grafikler PDF olarak indirildi!");
      handleExportSuccess("charts PDF");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Bilinmeyen hata";
      handleExportError("charts PDF", new Error(errorMessage));
      toast.error(`Grafik export hatası: ${errorMessage}`);
    } finally {
      setIsExporting(false);
      setExportingFormat("");
    }
  };

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Button
          onClick={() => exportData("excel")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          title="Excel olarak indir"
        >
          {isExporting && exportingFormat === "excel" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={() => exportData("csv")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          title="CSV olarak indir"
        >
          {isExporting && exportingFormat === "csv" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
        </Button>
        <Button
          onClick={() => exportData("json")}
          disabled={isExporting}
          variant="outline"
          size="sm"
          title="JSON olarak indir"
        >
          {isExporting && exportingFormat === "json" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Database className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  // Full variant
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Data Export Section */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Download className="h-4 w-4" />
          Veri Export İşlemleri
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={() => exportData("excel")}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
          >
            {isExporting && exportingFormat === "excel" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Excel İndir (.xlsx)
          </Button>
          <Button
            onClick={() => exportData("csv")}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
          >
            {isExporting && exportingFormat === "csv" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            CSV İndir (.csv)
          </Button>
          <Button
            onClick={() => exportData("json")}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
          >
            {isExporting && exportingFormat === "json" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            JSON İndir (.json)
          </Button>
        </div>
        <div className="text-xs text-gray-600 mt-2">
          💡 Excel ve CSV formatları makale yazımı için uygun tabloları içerir.
          JSON tam veri yapısını korur.
        </div>
      </div>

      {/* Visual Export Section */}
      {chartIds.length > 0 && (
        <div className="border rounded-lg p-4 bg-blue-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileIcon className="h-4 w-4" />
            Görsel Export İşlemleri
          </h4>
          <div className="space-y-3">
            <Button
              onClick={exportAllCharts}
              disabled={isExporting}
              variant="outline"
              className="w-full justify-start"
            >
              {isExporting && exportingFormat === "charts" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileIcon className="mr-2 h-4 w-4" />
              )}
              Tüm Grafikleri PDF Olarak İndir
            </Button>
            <div className="text-xs text-gray-600">
              📊 Tüm grafikler tek PDF dosyasında birleştirilecek
            </div>
          </div>
        </div>
      )}

      {/* Academic Report Section */}
      {showAcademicReport && (
        <div className="border rounded-lg p-4 bg-green-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Akademik Rapor
          </h4>
          <Button
            onClick={exportAcademicReport}
            disabled={isExporting}
            className="w-full justify-start bg-green-600 hover:bg-green-700"
          >
            {isExporting && exportingFormat === "academic" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BookOpen className="mr-2 h-4 w-4" />
            )}
            Kapsamlı Akademik Rapor Oluştur (PDF)
          </Button>
          <div className="text-xs text-gray-600 mt-2">
            🎓 Makale için hazır formatta kapsamlı rapor: özet, metodoloji
            karşılaştırması, grafikler ve sonuçlar
          </div>
        </div>
      )}

      {/* Export Information */}
      <div className="text-xs text-gray-500 p-3 bg-white border rounded-lg">
        <div className="font-medium mb-2">📋 Export Seçenekleri Hakkında:</div>
        <ul className="space-y-1 list-disc list-inside">
          <li>
            <strong>Excel:</strong> Çoklu sayfa ile detaylı analiz, özet
            tablolar ve grafikler
          </li>
          <li>
            <strong>CSV:</strong> Excel ve analiz yazılımlarında kullanım için
            optimize edilmiş
          </li>
          <li>
            <strong>JSON:</strong> Geliştiriciler ve API entegrasyonları için
            tam veri yapısı
          </li>
          <li>
            <strong>Akademik Rapor:</strong> Thesis ve makale yazımı için
            profesyonel PDF raporu
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DataExportControls;
